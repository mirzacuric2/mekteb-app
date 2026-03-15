import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { MapPin, PencilLine, Plus, Save, Trash2, UserPlus, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Loader } from "../common/components/loader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { EDITABLE_ROLE_VALUES, ROLE } from "../../types";
import { LESSON_NIVO, LESSON_NIVO_LABEL, LESSON_NIVO_ORDER } from "../lessons/constants";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const childSchema = z.object({
  firstName: z.string().min(2, "Child first name must be at least 2 characters."),
  lastName: z.string().min(2, "Child last name must be at least 2 characters."),
  ssn: z.string().min(10, "Child SSN must be at least 10 characters."),
  birthDate: z.string().min(1, "Child birth date is required."),
  nivo: z.nativeEnum(LESSON_NIVO),
});

const filledAddressSchema = z.object({
  streetLine1: z.string().trim().min(2, "Street line 1 must be at least 2 characters."),
  streetLine2: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().min(2, "Postal code must be at least 2 characters."),
  city: z.string().trim().min(2, "City must be at least 2 characters."),
  state: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().min(2, "Country must be at least 2 characters."),
});

const emptyAddressSchema = z.object({
  streetLine1: z.literal(""),
  streetLine2: z.string().trim().optional().or(z.literal("")),
  postalCode: z.literal(""),
  city: z.literal(""),
  state: z.string().trim().optional().or(z.literal("")),
  country: z.literal(""),
});

const userFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  ssn: z.string().min(10, "SSN must be at least 10 characters."),
  email: z.string().email("Enter a valid email address."),
  phoneNumber: z
    .string()
    .trim()
    .min(6, "Phone number must be at least 6 characters.")
    .max(30, "Phone number must be at most 30 characters.")
    .optional()
    .or(z.literal("")),
  role: z.enum(EDITABLE_ROLE_VALUES),
  communityId: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).default("PENDING"),
  address: z.union([filledAddressSchema, emptyAddressSchema]),
  children: z.array(childSchema).default([]),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
export type CommunityOption = { id: string; name: string };

type UserFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  canCreateAdmin: boolean;
  canSelectCommunity: boolean;
  forcedCommunityId?: string | null;
  communityOptions: CommunityOption[];
  submitting: boolean;
  apiError?: { field?: string; message: string } | null;
  initialValues?: Partial<UserFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => void;
};

export function UserFormDialog({
  open,
  mode,
  canCreateAdmin,
  canSelectCommunity,
  forcedCommunityId,
  communityOptions,
  submitting,
  apiError,
  initialValues,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitLocked, setSubmitLocked] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      ssn: "",
      email: "",
      phoneNumber: "",
      role: ROLE.BOARD_MEMBER,
      communityId: "",
      status: "PENDING",
      address: {
        streetLine1: "",
        streetLine2: "",
        postalCode: "",
        city: "",
        state: "",
        country: "",
      },
      children: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "children",
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    setSubmitLocked(false);
    reset({
      firstName: initialValues?.firstName || "",
      lastName: initialValues?.lastName || "",
      ssn: initialValues?.ssn || "",
      email: initialValues?.email || "",
      phoneNumber: initialValues?.phoneNumber || "",
      role: initialValues?.role || ROLE.BOARD_MEMBER,
      communityId: canSelectCommunity
        ? initialValues?.communityId || ""
        : forcedCommunityId || initialValues?.communityId || "",
      status: initialValues?.status || "PENDING",
      address: {
        streetLine1: initialValues?.address?.streetLine1 || "",
        streetLine2: initialValues?.address?.streetLine2 || "",
        postalCode: initialValues?.address?.postalCode || "",
        city: initialValues?.address?.city || "",
        state: initialValues?.address?.state || "",
        country: initialValues?.address?.country || "",
      },
      children: [],
    });
  }, [open, initialValues, reset, canSelectCommunity, forcedCommunityId]);

  useEffect(() => {
    if (!submitting) {
      setSubmitLocked(false);
    }
  }, [submitting]);

  useEffect(() => {
    if (!apiError) return;
    const field = apiError.field;
    if (
      field === "firstName" ||
      field === "lastName" ||
      field === "ssn" ||
      field === "email" ||
      field === "phoneNumber" ||
      field === "role" ||
      field === "communityId" ||
      field === "address" ||
      field === "status"
    ) {
      setError(field, { type: "server", message: apiError.message });
      return;
    }
    setServerError(apiError.message);
  }, [apiError, setError]);

  const errorsAny = errors as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <UserPlus className="h-4 w-4 text-slate-500" />
            ) : (
              <PencilLine className="h-4 w-4 text-slate-500" />
            )}
            <span>{mode === "create" ? t("createUser") : t("editUser")}</span>
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 max-h-[calc(90vh-73px)] flex-col"
          onSubmit={handleSubmit((values) => {
            setServerError(null);
            clearErrors();

            const normalizedValues: UserFormValues = {
              ...values,
              role: canCreateAdmin ? values.role : ROLE.BOARD_MEMBER,
              communityId: canSelectCommunity ? values.communityId : forcedCommunityId || values.communityId,
            };

            const parsed = userFormSchema.safeParse(normalizedValues);
            const communityMissing = mode === "create" && !normalizedValues.communityId;
            if (!parsed.success) {
              for (const issue of parsed.error.issues) {
                const [field] = issue.path;
                if (!field || typeof field !== "string") {
                  continue;
                }

                if (
                  field === "firstName" ||
                  field === "lastName" ||
                  field === "ssn" ||
                  field === "email" ||
                  field === "phoneNumber" ||
                  field === "role" ||
                  field === "communityId" ||
                  field === "status"
                ) {
                  setError(field, { type: "manual", message: issue.message });
                  continue;
                }

                if (field === "address" && typeof issue.path[1] === "string") {
                  setError(`address.${issue.path[1]}` as any, { type: "manual", message: issue.message });
                  continue;
                }

                if (
                  field === "children" &&
                  typeof issue.path[1] === "number" &&
                  typeof issue.path[2] === "string"
                ) {
                  setError(`children.${issue.path[1]}.${issue.path[2]}` as any, {
                    type: "manual",
                    message: issue.message,
                  });
                }
              }
            }

            if (communityMissing) {
              setError("communityId", {
                type: "manual",
                message: "Community is required for this role.",
              });
            }

            if (!parsed.success || communityMissing) {
              return;
            }

            setSubmitLocked(true);
            onSubmit(parsed.data);
          })}
        >
          <DialogBody className="space-y-5 overflow-y-auto">
            <div className="rounded-md border border-border p-3">
              <p className="mb-3 text-sm font-semibold text-slate-900">{t("basicInfo")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("firstName")}</label>
                  <Input {...register("firstName")} />
                  {errors.firstName ? (
                    <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("lastName")}</label>
                  <Input {...register("lastName")} />
                  {errors.lastName ? (
                    <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                  ) : null}
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("email")}</label>
                  <Input {...register("email")} disabled={mode === "edit"} />
                  {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("phoneNumber")}</label>
                  <Input {...register("phoneNumber")} placeholder="+387..." />
                  {errors.phoneNumber ? (
                    <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("ssn")}</label>
                  <Input {...register("ssn")} placeholder="YYYYMMDDXXXX" />
                  {errors.ssn ? <p className="mt-1 text-xs text-red-600">{errors.ssn.message}</p> : null}
                </div>
                {canCreateAdmin ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t("role")}</label>
                    <Select {...register("role")}>
                      <option value={ROLE.BOARD_MEMBER}>{ROLE.BOARD_MEMBER}</option>
                      <option value={ROLE.PARENT}>{ROLE.PARENT}</option>
                      <option value={ROLE.ADMIN}>{ROLE.ADMIN}</option>
                    </Select>
                    {errors.role ? <p className="mt-1 text-xs text-red-600">{errors.role.message}</p> : null}
                  </div>
                ) : null}
                {canSelectCommunity ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t("community")}</label>
                    <Select {...register("communityId")}>
                      <option value="">{t("unassigned")}</option>
                      {communityOptions.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))}
                    </Select>
                    {errors.communityId ? (
                      <p className="mt-1 text-xs text-red-600">{errors.communityId.message}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">{t("address")}</p>
              </div>
              <p className="mb-3 text-xs text-slate-500">{t("addressHint")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("streetLine1")}</label>
                  <Input placeholder="Street and number" {...register("address.streetLine1")} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("streetLine2Optional")}</label>
                  <Input placeholder="Apartment, floor, unit..." {...register("address.streetLine2")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("postalCode")}</label>
                  <Input placeholder="71000" {...register("address.postalCode")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("city")}</label>
                  <Input placeholder="Sarajevo" {...register("address.city")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("stateOptional")}</label>
                  <Input placeholder="Canton / Region" {...register("address.state")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("country")}</label>
                  <Input placeholder="Bosnia and Herzegovina" {...register("address.country")} />
                </div>
              </div>
              {errorsAny?.address?.streetLine1 ? (
                <p className="mt-1 text-xs text-red-600">{errorsAny.address.streetLine1.message}</p>
              ) : null}
              {errorsAny?.address?.postalCode ? (
                <p className="mt-1 text-xs text-red-600">{errorsAny.address.postalCode.message}</p>
              ) : null}
              {errorsAny?.address?.city ? (
                <p className="mt-1 text-xs text-red-600">{errorsAny.address.city.message}</p>
              ) : null}
              {errorsAny?.address?.country ? (
                <p className="mt-1 text-xs text-red-600">{errorsAny.address.country.message}</p>
              ) : null}
            </div>

            {mode === "edit" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("status")}</label>
                <Select {...register("status")}>
                  <option value="PENDING">{t("pending")}</option>
                  <option value="ACTIVE">{t("active")}</option>
                  <option value="INACTIVE">{t("inactive")}</option>
                </Select>
                {errors.status ? <p className="mt-1 text-xs text-red-600">{errors.status.message}</p> : null}
              </div>
            ) : null}

            <div className="rounded-md border border-border p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-semibold text-slate-900">{t("childrenCount")}</label>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {fields.length}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center gap-1"
                  onClick={() =>
                    append({
                      firstName: "",
                      lastName: "",
                      ssn: "",
                      birthDate: "",
                      nivo: LESSON_NIVO.First,
                    })
                  }
                >
                  <Plus size={14} />
                  {t("addChildItem")}
                </Button>
              </div>

              {fields.length ? (
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-md border border-border bg-slate-50/50 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Child {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="inline-flex items-center gap-1 px-2"
                          onClick={() => remove(index)}
                        >
                          <Trash2 size={14} />
                          {t("remove")}
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("firstName")}</label>
                          <Input placeholder="First name" {...register(`children.${index}.firstName` as const)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("lastName")}</label>
                          <Input placeholder="Last name" {...register(`children.${index}.lastName` as const)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("ssn")}</label>
                          <Input placeholder="YYYYMMDDXXXX" {...register(`children.${index}.ssn` as const)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("birthDate")}</label>
                          <Input type="date" {...register(`children.${index}.birthDate` as const)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Nivo</label>
                          <Select {...register(`children.${index}.nivo` as const, { valueAsNumber: true })}>
                            {LESSON_NIVO_ORDER.map((value) => (
                              <option key={value} value={value}>
                                {LESSON_NIVO_LABEL[value]}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      {errorsAny?.children?.[index]?.firstName ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errorsAny.children[index].firstName.message}
                        </p>
                      ) : null}
                      {errorsAny?.children?.[index]?.lastName ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errorsAny.children[index].lastName.message}
                        </p>
                      ) : null}
                      {errorsAny?.children?.[index]?.ssn ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errorsAny.children[index].ssn.message}
                        </p>
                      ) : null}
                      {errorsAny?.children?.[index]?.birthDate ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errorsAny.children[index].birthDate.message}
                        </p>
                      ) : null}
                      {errorsAny?.children?.[index]?.nivo ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errorsAny.children[index].nivo.message}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t("noChildrenAdded")}</p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            {serverError ? <p className="mr-auto text-xs text-red-600">{serverError}</p> : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting || submitLocked} className="gap-2">
              {mode === "create" && submitting ? <Loader size="sm" text="" className="text-current" /> : null}
              {(!submitting || mode !== "create") ? <Save className="h-4 w-4" /> : null}
              {mode === "create" ? t("createUser") : t("saveUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
