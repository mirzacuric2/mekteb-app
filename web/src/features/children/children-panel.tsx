import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../../api";
import { AxiosError } from "axios";
import { z } from "zod";
import { toast } from "sonner";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuthedQuery } from "../common/use-authed-query";
import { useSession } from "../auth/session-context";
import { ROLE } from "../../types";
import { LESSON_NIVO, LESSON_NIVO_LABEL, LESSON_NIVO_ORDER, LessonNivo } from "../lessons/constants";
import { Select } from "../../components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { ComboboxChips } from "../../components/ui/combobox-chips";
import { MapPin, PencilLine, Save, UserPlus, Users, X } from "lucide-react";
import { EntityListToolbar } from "../common/components/entity-list-toolbar";
import { Loader } from "../common/components/loader";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { EntityDetailsDrawer } from "../common/components/entity-details-drawer";
import { ChildrenTable } from "./children-table";
import { ChildDetailsDrawerContent } from "./child-details-drawer-content";
import { NivoProgress } from "./nivo-progress";
import { CHILD_STATUS, CHILD_STATUS_LABEL, type ChildRecord } from "./types";

type Props = { canManage: boolean };
type UserOption = { id: string; firstName: string; lastName: string; role: string; communityId?: string | null };
type CommunityOption = { id: string; name: string };
type ChildFormErrors = Partial<{
  firstName: string;
  lastName: string;
  ssn: string;
  birthDate: string;
  communityId: string;
  parentIds: string;
  streetLine1: string;
  postalCode: string;
  city: string;
  country: string;
}>;

const SSN_MIN_LENGTH = 10;
const SSN_MAX_LENGTH = 20;
const MIN_TEXT_LENGTH = 2;
const birthDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const isValidIsoDateString = (value: string) => {
  if (!birthDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
};

const childFormSchema = z
  .object({
    firstName: z.string().trim().min(MIN_TEXT_LENGTH, "First name must be at least 2 characters."),
    lastName: z.string().trim().min(MIN_TEXT_LENGTH, "Last name must be at least 2 characters."),
    ssn: z.string().trim().superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSN is required." });
        return;
      }
      if (value.length < SSN_MIN_LENGTH || value.length > SSN_MAX_LENGTH) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SSN must be between 10 and 20 characters." });
      }
    }),
    birthDate: z
      .string()
      .trim()
      .min(1, "Birth date is required.")
      .refine((value) => isValidIsoDateString(value), "Birth date must be valid (YYYY-MM-DD)."),
    communityId: z.string().trim(),
    parentIds: z.array(z.string().trim()),
    streetLine1: z.string().trim(),
    streetLine2: z.string().trim(),
    postalCode: z.string().trim(),
    city: z.string().trim(),
    stateValue: z.string().trim(),
    country: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    const hasAnyAddressValue = Boolean(
      values.streetLine1 || values.streetLine2 || values.postalCode || values.city || values.stateValue || values.country
    );
    if (!hasAnyAddressValue) return;

    if (values.streetLine1.length < MIN_TEXT_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["streetLine1"],
        message: "Street line 1 must be at least 2 characters.",
      });
    }
    if (values.postalCode.length < MIN_TEXT_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postalCode"],
        message: "Postal code must be at least 2 characters.",
      });
    }
    if (values.city.length < MIN_TEXT_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "City must be at least 2 characters.",
      });
    }
    if (values.country.length < MIN_TEXT_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["country"],
        message: "Country must be at least 2 characters.",
      });
    }
  });

export function ChildrenPanel({ canManage: _canManage }: Props) {
  const { session } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ssn, setSsn] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nivo, setNivo] = useState<LessonNivo>(LESSON_NIVO.First);
  const [communityId, setCommunityId] = useState("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [streetLine1, setStreetLine1] = useState("");
  const [streetLine2, setStreetLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingChild, setDeletingChild] = useState<ChildRecord | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildRecord | null>(null);
  const [formApiError, setFormApiError] = useState<{ field?: string; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<ChildFormErrors>({});
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const canAdminManage = session?.user.role === ROLE.ADMIN || session?.user.role === ROLE.SUPER_ADMIN;
  const canParentEdit = session?.user.role === ROLE.PARENT || session?.user.role === ROLE.USER;
  const canEditChildren = canAdminManage || canParentEdit;
  const canInactivate = canAdminManage;
  const canChooseCommunity = session?.user.role === ROLE.SUPER_ADMIN;
  const children = useAuthedQuery<ChildRecord[]>("children", "/children", true);
  const users = useAuthedQuery<UserOption[]>("children-parent-options", "/users", canAdminManage);
  const communities = useAuthedQuery<CommunityOption[]>("children-community-options", "/communities", canChooseCommunity);
  const visibleParents = (users.data || []).filter(
    (user) =>
      (user.role === ROLE.PARENT || user.role === ROLE.USER) &&
      (!canChooseCommunity || !communityId || user.communityId === communityId)
  );
  const hasAddress =
    streetLine1.trim() && postalCode.trim() && city.trim() && country.trim();
  const parentOptions = visibleParents.map((parent) => ({
    value: parent.id,
    label: `${parent.firstName} ${parent.lastName}`.trim(),
  }));
  const getApiFieldError = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { message?: string; field?: string } | undefined;
      return { field: data?.field, message: data?.message || fallback };
    }
    return { message: fallback };
  };
  const clearFormError = (field: keyof ChildFormErrors) => {
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const validateChildForm = () => {
    const parsed = childFormSchema.safeParse({
      firstName,
      lastName,
      ssn,
      birthDate,
      communityId,
      parentIds,
      streetLine1,
      streetLine2,
      postalCode,
      city,
      stateValue,
      country,
    });

    const nextErrors: ChildFormErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const [field] = issue.path;
        if (
          field === "firstName" ||
          field === "lastName" ||
          field === "ssn" ||
          field === "birthDate" ||
          field === "streetLine1" ||
          field === "postalCode" ||
          field === "city" ||
          field === "country"
        ) {
          nextErrors[field] = issue.message;
        }
      }
    }

    if (canChooseCommunity && !communityId.trim()) {
      nextErrors.communityId = "Community is required.";
    }
    if (canAdminManage && parentIds.length === 0) {
      nextErrors.parentIds = "At least one parent is required.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createChild = useMutation({
    mutationFn: async () =>
      (
        await api.post("/children", {
          firstName,
          lastName,
          ssn: ssn.trim(),
          birthDate,
          nivo,
          communityId: canChooseCommunity ? communityId || undefined : undefined,
          parentIds,
          address: hasAddress
            ? {
                streetLine1: streetLine1.trim(),
                streetLine2: streetLine2.trim() || undefined,
                postalCode: postalCode.trim(),
                city: city.trim(),
                state: stateValue.trim() || undefined,
                country: country.trim(),
              }
            : undefined,
        })
      ).data,
    onSuccess: async () => {
      setFormApiError(null);
      setFormErrors({});
      setFirstName("");
      setLastName("");
      setSsn("");
      setBirthDate("");
      setNivo(LESSON_NIVO.First);
      setParentIds([]);
      setStreetLine1("");
      setStreetLine2("");
      setPostalCode("");
      setCity("");
      setStateValue("");
      setCountry("");
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      toast.success("Child created.");
    },
    onError: (error) => {
      const apiFieldError = getApiFieldError(error, "Failed to create child.");
      setFormApiError(apiFieldError);
      toast.error(apiFieldError.message);
    },
  });

  const updateChild = useMutation({
    mutationFn: async () =>
      (
        await api.patch(`/children/${editingId}`, {
          firstName,
          lastName,
          ssn: ssn.trim(),
          birthDate,
          nivo: canAdminManage ? nivo : undefined,
          communityId: canAdminManage && canChooseCommunity ? communityId || undefined : undefined,
          parentIds: canAdminManage ? parentIds : undefined,
          address: hasAddress
            ? {
                streetLine1: streetLine1.trim(),
                streetLine2: streetLine2.trim() || undefined,
                postalCode: postalCode.trim(),
                city: city.trim(),
                state: stateValue.trim() || undefined,
                country: country.trim(),
              }
            : null,
        })
      ).data,
    onSuccess: async () => {
      setFormApiError(null);
      setFormErrors({});
      setEditingId(null);
      setFirstName("");
      setLastName("");
      setSsn("");
      setBirthDate("");
      setNivo(LESSON_NIVO.First);
      setParentIds([]);
      setStreetLine1("");
      setStreetLine2("");
      setPostalCode("");
      setCity("");
      setStateValue("");
      setCountry("");
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      toast.success("Child updated.");
    },
    onError: (error) => {
      const apiFieldError = getApiFieldError(error, "Failed to update child.");
      setFormApiError(apiFieldError);
      toast.error(apiFieldError.message);
    },
  });

  const inactivateChild = useMutation({
    mutationFn: async (id: string) => api.delete(`/children/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
      setDeletingChild(null);
    },
  });
  const completeChild = useMutation({
    mutationFn: async (id: string) =>
      (
        await api.patch(`/children/${id}`, {
          status: CHILD_STATUS.COMPLETED,
        })
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
  const markDiscontinuedChild = useMutation({
    mutationFn: async (id: string) =>
      (
        await api.patch(`/children/${id}`, {
          status: CHILD_STATUS.DISCONTINUED,
        })
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const statusLabel = CHILD_STATUS_LABEL;
  const filteredChildren = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return children.data || [];

    return (children.data || []).filter((child) => {
      const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
      const ssnValue = (child.ssn || "").toLowerCase();
      const statusValue = statusLabel[child.status].toLowerCase();
      const parentsValue = (child.parents || [])
        .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim().toLowerCase())
        .join(" ");

      return (
        fullName.includes(term) ||
        ssnValue.includes(term) ||
        statusValue.includes(term) ||
        parentsValue.includes(term)
      );
    });
  }, [children.data, search]);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredChildren.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedChildren = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredChildren.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredChildren]);

  return (
    <Card className="min-w-0 space-y-4 overflow-x-hidden">
      <EntityListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search children by name, SSN, status, or parent..."
        actions={
          canAdminManage ? (
            <Button
              className="h-10 w-10 px-0 md:w-auto md:px-3 md:gap-2"
              onClick={() => {
                setEditingId(null);
                setFormApiError(null);
                setFormErrors({});
                setFirstName("");
                setLastName("");
                setSsn("");
                setBirthDate("");
                setNivo(LESSON_NIVO.First);
                setParentIds([]);
                setStreetLine1("");
                setStreetLine2("");
                setPostalCode("");
                setCity("");
                setStateValue("");
                setCountry("");
                setFormOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden md:inline">Create child</span>
            </Button>
          ) : undefined
        }
      />
      {children.isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed border-border">
          <Loader size="md" />
        </div>
      ) : (
        <ChildrenTable
          children={pagedChildren}
          isLoading={children.isLoading}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(child) => setSelectedChild(child)}
          onEdit={(child) => {
            setFormApiError(null);
            setFormErrors({});
            setEditingId(child.id);
            setFirstName(child.firstName);
            setLastName(child.lastName);
            setSsn(child.ssn || "");
            setBirthDate(new Date(child.birthDate).toISOString().slice(0, 10));
            setNivo(child.nivo);
            setCommunityId(child.communityId);
            setParentIds((child.parents || []).map((parent) => parent.parentId));
            setStreetLine1(child.address?.streetLine1 || "");
            setStreetLine2(child.address?.streetLine2 || "");
            setPostalCode(child.address?.postalCode || "");
            setCity(child.address?.city || "");
            setStateValue(child.address?.state || "");
            setCountry(child.address?.country || "");
            setFormOpen(true);
          }}
          onDelete={(child) => {
            if (canInactivate && child.status !== CHILD_STATUS.INACTIVE) {
              setDeletingChild(child);
            }
          }}
          canEdit={canEditChildren}
          canDelete={canInactivate}
        />
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setFormApiError(null);
            setFormErrors({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <PencilLine className="h-4 w-4 text-slate-500" /> : <UserPlus className="h-4 w-4 text-slate-500" />}
              <span>{editingId ? "Edit child" : "Create child"}</span>
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFormError("firstName");
                  }}
                />
                {formErrors.firstName ? <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p> : null}
              </div>
              <div>
                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFormError("lastName");
                  }}
                />
                {formErrors.lastName ? <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p> : null}
              </div>
              <div>
                <Input
                  placeholder="SSN"
                  value={ssn}
                  onChange={(e) => {
                    setSsn(e.target.value);
                    clearFormError("ssn");
                  }}
                />
                {formErrors.ssn ? <p className="mt-1 text-xs text-red-600">{formErrors.ssn}</p> : null}
              </div>
              <div>
                <Input
                  placeholder="Birth date (YYYY-MM-DD)"
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    clearFormError("birthDate");
                  }}
                />
                {formErrors.birthDate ? <p className="mt-1 text-xs text-red-600">{formErrors.birthDate}</p> : null}
              </div>
              {canChooseCommunity ? (
                <div>
                  <Select
                    value={communityId}
                    onChange={(e) => {
                      setCommunityId(e.target.value);
                      clearFormError("communityId");
                    }}
                  >
                    <option value="">Select community</option>
                    {(communities.data || []).map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </Select>
                  {formErrors.communityId ? <p className="mt-1 text-xs text-red-600">{formErrors.communityId}</p> : null}
                </div>
              ) : null}
              {canAdminManage ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-slate-700">Nivo</p>
                  <NivoProgress nivo={nivo} showIndexLabel selectable onSelect={setNivo} />
                </div>
              ) : null}
              {canAdminManage ? (
                <div className="md:col-span-2 rounded-md border border-border p-2">
                  <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <Users className="h-3.5 w-3.5" />
                    <span>Parents (required, can be multiple)</span>
                  </p>
                  <ComboboxChips
                    multiple
                    options={parentOptions}
                    values={parentIds}
                    onChange={(nextValues) => {
                      setParentIds(nextValues);
                      if (nextValues.length > 0) clearFormError("parentIds");
                      if (formApiError?.field === "parentIds") {
                        setFormApiError(null);
                      }
                    }}
                    placeholder="Select parent(s)"
                    emptyText="No parents found."
                  />
                  {formErrors.parentIds || formApiError?.field === "parentIds" ? (
                    <p className="mt-1 text-xs text-red-600">
                      {formApiError?.field === "parentIds" ? formApiError.message : "At least one parent is required."}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="md:col-span-2 rounded-md border border-border p-2.5">
                <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span>Address (optional)</span>
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Street line 1 (optional)"
                    value={streetLine1}
                    onChange={(e) => {
                      setStreetLine1(e.target.value);
                      clearFormError("streetLine1");
                    }}
                  />
                  <Input placeholder="Street line 2 (optional)" value={streetLine2} onChange={(e) => setStreetLine2(e.target.value)} />
                  <Input
                    placeholder="Postal code (optional)"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      clearFormError("postalCode");
                    }}
                  />
                  <Input
                    placeholder="City (optional)"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      clearFormError("city");
                    }}
                  />
                  <Input placeholder="State (optional)" value={stateValue} onChange={(e) => setStateValue(e.target.value)} />
                  <Input
                    placeholder="Country (optional)"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      clearFormError("country");
                    }}
                  />
                </div>
                {formErrors.streetLine1 ? <p className="mt-1 text-xs text-red-600">{formErrors.streetLine1}</p> : null}
                {formErrors.postalCode ? <p className="mt-1 text-xs text-red-600">{formErrors.postalCode}</p> : null}
                {formErrors.city ? <p className="mt-1 text-xs text-red-600">{formErrors.city}</p> : null}
                {formErrors.country ? <p className="mt-1 text-xs text-red-600">{formErrors.country}</p> : null}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            {formApiError && formApiError.field !== "parentIds" ? (
              <p className="mr-auto text-xs text-red-600">{formApiError.message}</p>
            ) : null}
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            {editingId ? (
              <Button
                onClick={() => {
                  setFormApiError(null);
                  if (!validateChildForm()) return;
                  updateChild.mutate();
                }}
                disabled={updateChild.isPending}
              >
                <Save className="mr-1 h-4 w-4" />
                Save child
              </Button>
            ) : canAdminManage ? (
              <Button
                onClick={() => {
                  setFormApiError(null);
                  if (!validateChildForm()) return;
                  createChild.mutate();
                }}
                disabled={createChild.isPending || !canAdminManage}
              >
                <UserPlus className="mr-1 h-4 w-4" />
                Create child
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EntityDetailsDrawer
        open={!!selectedChild}
        onOpenChange={(open) => {
          if (!open) setSelectedChild(null);
        }}
        title={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : "Child details"}
        headerMeta={
          selectedChild ? (
            <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
              {statusLabel[selectedChild.status]}
            </span>
          ) : undefined
        }
        description="Child details"
      >
        {selectedChild ? <ChildDetailsDrawerContent child={selectedChild} /> : null}
      </EntityDetailsDrawer>
      <DeleteConfirmDialog
        open={!!deletingChild}
        onOpenChange={(open) => {
          if (!open) setDeletingChild(null);
        }}
        title="Inactivate child"
        description={
          deletingChild
            ? `Set ${deletingChild.firstName} ${deletingChild.lastName} to INACTIVE?`
            : "Set selected child to INACTIVE?"
        }
        confirmText="Set INACTIVE"
        submitting={inactivateChild.isPending}
        onConfirm={() => {
          if (!deletingChild) return;
          inactivateChild.mutate(deletingChild.id);
        }}
      />
    </Card>
  );
}
