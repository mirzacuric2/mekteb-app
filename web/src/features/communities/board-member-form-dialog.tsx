import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Save, ShieldUser, UserPlus, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { BOARD_MEMBER_ROLE_LABEL, BOARD_MEMBER_ROLE_ORDER } from "./constants";
import { BOARD_MEMBER_ROLE } from "./types";

const boardMemberFormSchema = z
  .object({
    source: z.enum(["linked", "standalone"]),
    role: z.nativeEnum(BOARD_MEMBER_ROLE),
    userId: z.string().optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phoneNumber: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    address: z.object({
      streetLine1: z.string().trim().optional(),
      streetLine2: z.string().trim().optional(),
      postalCode: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      country: z.string().trim().optional(),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.source === "linked" && !value.userId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Select a linked user." });
    }
    if (value.source === "standalone" && (!value.firstName || !value.lastName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "Standalone board members require first and last name.",
      });
    }
  });

export type BoardMemberFormValues = z.infer<typeof boardMemberFormSchema>;

export type UserOption = {
  id: string;
  label: string;
};

type BoardMemberFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  submitting: boolean;
  userOptions: UserOption[];
  initialValues?: Partial<BoardMemberFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BoardMemberFormValues) => void;
};

export function BoardMemberFormDialog({
  open,
  mode,
  submitting,
  userOptions,
  initialValues,
  onOpenChange,
  onSubmit,
}: BoardMemberFormDialogProps) {
  const [submitLocked, setSubmitLocked] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<BoardMemberFormValues>({
    defaultValues: {
      source: "linked",
      role: BOARD_MEMBER_ROLE.MEMBER,
      userId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      notes: "",
      address: {
        streetLine1: "",
        streetLine2: "",
        postalCode: "",
        city: "",
        state: "",
        country: "",
      },
    },
  });
  const source = watch("source");

  useEffect(() => {
    if (!open) return;
    setSubmitLocked(false);
    reset({
      source: initialValues?.source || (initialValues?.userId ? "linked" : "standalone"),
      role: initialValues?.role || BOARD_MEMBER_ROLE.MEMBER,
      userId: initialValues?.userId || "",
      firstName: initialValues?.firstName || "",
      lastName: initialValues?.lastName || "",
      email: initialValues?.email || "",
      phoneNumber: initialValues?.phoneNumber || "",
      notes: initialValues?.notes || "",
      address: {
        streetLine1: initialValues?.address?.streetLine1 || "",
        streetLine2: initialValues?.address?.streetLine2 || "",
        postalCode: initialValues?.address?.postalCode || "",
        city: initialValues?.address?.city || "",
        state: initialValues?.address?.state || "",
        country: initialValues?.address?.country || "",
      },
    });
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!submitting) setSubmitLocked(false);
  }, [submitting]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? <UserPlus className="h-4 w-4 text-slate-500" /> : <ShieldUser className="h-4 w-4 text-slate-500" />}
            <span>{mode === "create" ? "Add board member" : "Edit board member"}</span>
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => {
            clearErrors();
            const parsed = boardMemberFormSchema.safeParse(values);
            if (!parsed.success) {
              for (const issue of parsed.error.issues) {
                const [field] = issue.path;
                if (
                  field === "source" ||
                  field === "role" ||
                  field === "userId" ||
                  field === "firstName" ||
                  field === "lastName"
                ) {
                  setError(field, { type: "manual", message: issue.message });
                }
              }
              return;
            }
            setSubmitLocked(true);
            onSubmit(parsed.data);
          })}
        >
          <DialogBody className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Member source</label>
                <Select {...register("source")}>
                  <option value="linked">Select from platform users</option>
                  <option value="standalone">Enter standalone board member</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Board role</label>
                <Select {...register("role")}>
                  {BOARD_MEMBER_ROLE_ORDER.map((role) => (
                    <option key={role} value={role}>
                      {BOARD_MEMBER_ROLE_LABEL[role]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {source === "linked" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Linked user</label>
                <Select {...register("userId")}>
                  <option value="">Select user...</option>
                  {userOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {errors.userId ? <p className="mt-1 text-xs text-red-600">{errors.userId.message}</p> : null}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
                  <Input {...register("firstName")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
                  <Input {...register("lastName")} />
                </div>
              </div>
            )}
            {errors.firstName ? <p className="text-xs text-red-600">{errors.firstName.message}</p> : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <Input {...register("email")} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
                <Input {...register("phoneNumber")} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <Input {...register("notes")} />
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">Address (optional)</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Street line 1" {...register("address.streetLine1")} />
                <Input placeholder="Street line 2" {...register("address.streetLine2")} />
                <Input placeholder="Postal code" {...register("address.postalCode")} />
                <Input placeholder="City" {...register("address.city")} />
                <Input placeholder="State" {...register("address.state")} />
                <Input placeholder="Country" {...register("address.country")} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || submitLocked}>
              <Save className="mr-1 h-4 w-4" />
              {mode === "create" ? "Add board member" : "Save board member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
