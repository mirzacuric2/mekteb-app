import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Building2, Info, PencilLine, Plus, Save, Trash2, Users, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ComboboxChips } from "../../components/ui/combobox-chips";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Tabs } from "../../components/ui/tabs";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { BOARD_MEMBER_ROLE_LABEL, BOARD_MEMBER_ROLE_ORDER } from "./constants";
import { BoardMemberRole } from "./types";

const communityFormSchema = z.object({
  name: z.string().trim().min(2, "Community name must be at least 2 characters."),
  description: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email."),
  contactPhone: z.string().trim().optional(),
  address: z.object({
    streetLine1: z.string().trim().min(2, "Street line 1 is required."),
    streetLine2: z.string().trim().optional(),
    postalCode: z.string().trim().min(2, "Postal code is required."),
    city: z.string().trim().min(2, "City is required."),
    state: z.string().trim().optional(),
    country: z.string().trim().min(2, "Country is required."),
  }),
  adminUserIds: z.array(z.string()).default([]),
  boardMembers: z
    .array(
      z.object({
        userId: z.string().trim().min(1, "Select user."),
        role: z.custom<BoardMemberRole>(),
      })
    )
    .default([]),
});

export type CommunityFormValues = z.infer<typeof communityFormSchema>;

export type AdminOption = {
  id: string;
  label: string;
};

export type BoardMemberUserOption = {
  id: string;
  label: string;
};

type CommunityFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  submitting: boolean;
  canAssignAdmins: boolean;
  assignedAdmins: AdminOption[];
  adminOptions: AdminOption[];
  boardMemberUserOptions: BoardMemberUserOption[];
  initialValues?: Partial<CommunityFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CommunityFormValues) => void;
};

export function CommunityFormDialog({
  open,
  mode,
  submitting,
  canAssignAdmins,
  assignedAdmins,
  adminOptions,
  boardMemberUserOptions,
  initialValues,
  onOpenChange,
  onSubmit,
}: CommunityFormDialogProps) {
  const canEditIdentity = mode === "create" || canAssignAdmins;
  const [submitLocked, setSubmitLocked] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "members">("basic");
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CommunityFormValues>({
    defaultValues: {
      name: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: {
        streetLine1: "",
        streetLine2: "",
        postalCode: "",
        city: "",
        state: "",
        country: "",
      },
      adminUserIds: [],
      boardMembers: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "boardMembers",
  });
  const selectedAdminIds = watch("adminUserIds");

  useEffect(() => {
    if (!open) return;
    setSubmitLocked(false);
    setPendingRemoveIndex(null);
    setActiveTab("basic");
    reset({
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      contactEmail: initialValues?.contactEmail || "",
      contactPhone: initialValues?.contactPhone || "",
      address: {
        streetLine1: initialValues?.address?.streetLine1 || "",
        streetLine2: initialValues?.address?.streetLine2 || "",
        postalCode: initialValues?.address?.postalCode || "",
        city: initialValues?.address?.city || "",
        state: initialValues?.address?.state || "",
        country: initialValues?.address?.country || "",
      },
      adminUserIds: initialValues?.adminUserIds || [],
      boardMembers: initialValues?.boardMembers || [],
    });
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!submitting) setSubmitLocked(false);
  }, [submitting]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[84vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? <Building2 className="h-4 w-4 text-slate-500" /> : <PencilLine className="h-4 w-4 text-slate-500" />}
            <span>{mode === "create" ? "Create community" : "Edit community"}</span>
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex max-h-[calc(84vh-72px)] flex-col"
          onSubmit={handleSubmit((values) => {
            clearErrors();
            const parsed = communityFormSchema.safeParse(values);
            if (!parsed.success) {
              for (const issue of parsed.error.issues) {
                const [field, nestedField] = issue.path;
                if (
                  field === "name" ||
                  field === "description" ||
                  field === "contactEmail" ||
                  field === "contactPhone" ||
                  field === "adminUserIds"
                ) {
                  setError(field, { type: "manual", message: issue.message });
                }
                if (field === "address" && typeof nestedField === "string") {
                  setError(`address.${nestedField}` as keyof CommunityFormValues, {
                    type: "manual",
                    message: issue.message,
                  });
                }
              }
              return;
            }
            setSubmitLocked(true);
            onSubmit(parsed.data);
          })}
        >
          <DialogBody className="space-y-2 overflow-y-auto">
            <Tabs
              value={activeTab}
              onChange={(value) => setActiveTab(value as "basic" | "members")}
              tabs={[
                {
                  key: "basic",
                  label: (
                    <>
                      <Info className="h-4 w-4" />
                      <span>Basic info</span>
                    </>
                  ),
                },
                {
                  key: "members",
                  label: (
                    <>
                      <Users className="h-4 w-4" />
                      <span>Members</span>
                    </>
                  ),
                },
              ]}
            >
              {activeTab === "basic" ? (
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Community name</label>
                    <Input {...register("name")} disabled={!canEditIdentity} />
                    {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                    <Input {...register("description")} disabled={!canEditIdentity} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Contact email</label>
                      <Input {...register("contactEmail")} />
                      {errors.contactEmail ? <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p> : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Contact phone</label>
                      <Input {...register("contactPhone")} />
                    </div>
                  </div>

                  <div className="rounded-md border border-border p-2.5">
                    <p className="mb-2 text-sm font-medium text-slate-700">Address (required)</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Street line 1</label>
                        <Input {...register("address.streetLine1")} />
                        {errors.address?.streetLine1 ? (
                          <p className="mt-1 text-xs text-red-600">{errors.address.streetLine1.message}</p>
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Street line 2</label>
                        <Input {...register("address.streetLine2")} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Postal code</label>
                        <Input {...register("address.postalCode")} />
                        {errors.address?.postalCode ? (
                          <p className="mt-1 text-xs text-red-600">{errors.address.postalCode.message}</p>
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">City</label>
                        <Input {...register("address.city")} />
                        {errors.address?.city ? <p className="mt-1 text-xs text-red-600">{errors.address.city.message}</p> : null}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">State</label>
                        <Input {...register("address.state")} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Country</label>
                        <Input {...register("address.country")} />
                        {errors.address?.country ? (
                          <p className="mt-1 text-xs text-red-600">{errors.address.country.message}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-md border border-border p-2.5">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Imam assignment
                      {canAssignAdmins ? " (super admin only)" : " (super admin restricted)"}
                    </p>
                    {canAssignAdmins ? (
                      <div className="space-y-2">
                        <ComboboxChips
                          multiple
                          options={adminOptions.map((option) => ({ value: option.id, label: option.label }))}
                          values={selectedAdminIds}
                          onChange={(nextValues) => setValue("adminUserIds", nextValues, { shouldDirty: true })}
                          placeholder="Select admin(s) for this community"
                          emptyText="No admin users available."
                        />
                        {adminOptions.length ? (
                          <p className="text-xs text-slate-500">You can select one or more admins (Imams).</p>
                        ) : (
                          <p className="text-xs text-slate-500">No admin users available.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {assignedAdmins.length ? (
                          assignedAdmins.map((admin) => (
                            <p key={admin.id} className="text-sm text-slate-700">
                              {admin.label}
                            </p>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No imam assignment found for this community.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-md border border-border p-2.5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">Board members</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ userId: "", role: "MEMBER" as BoardMemberRole })}
                      >
                        <Plus className="h-4 w-4" />
                        Add board member
                      </Button>
                    </div>
                    <p className="mb-2 text-xs text-slate-500">
                      Select users from the list and assign board roles.
                    </p>
                    {fields.length ? (
                      <div className="space-y-2">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid gap-2 rounded-md border border-border p-2 md:grid-cols-[2fr_1fr_auto]">
                            <Select {...register(`boardMembers.${index}.userId`)}>
                              <option value="">Select user...</option>
                              {boardMemberUserOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                            <Select {...register(`boardMembers.${index}.role`)}>
                              {BOARD_MEMBER_ROLE_ORDER.map((role) => (
                                <option key={role} value={role}>
                                  {BOARD_MEMBER_ROLE_LABEL[role]}
                                </option>
                              ))}
                            </Select>
                            <Button type="button" variant="outline" onClick={() => setPendingRemoveIndex(index)}>
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No board members selected yet.</p>
                    )}
                  </div>
                </div>
              )}
            </Tabs>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || submitLocked}>
              <Save className="h-4 w-4" />
              {mode === "create" ? "Create community" : "Save community"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <DeleteConfirmDialog
        open={pendingRemoveIndex !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingRemoveIndex(null);
        }}
        title="Remove board member"
        description="Are you sure you want to remove this board member assignment?"
        confirmText="Remove"
        onConfirm={() => {
          if (pendingRemoveIndex === null) return;
          remove(pendingRemoveIndex);
          setPendingRemoveIndex(null);
        }}
      />
    </Dialog>
  );
}
