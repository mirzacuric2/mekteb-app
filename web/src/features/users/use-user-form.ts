import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ROLE } from "../../types";
import { USER_FORM_DEFAULT_VALUES, UserFormValues, userFormSchema } from "./user-form-schema";

type UseUserFormArgs = {
  open: boolean;
  mode: "create" | "edit";
  canCreateAdmin: boolean;
  canSelectCommunity: boolean;
  forcedCommunityId?: string | null;
  initialValues?: Partial<UserFormValues>;
  submitting: boolean;
  apiError?: { field?: string; message: string } | null;
  onSubmit: (values: UserFormValues) => void;
};

export function useUserForm({
  open,
  mode,
  canCreateAdmin,
  canSelectCommunity,
  forcedCommunityId,
  initialValues,
  submitting,
  apiError,
  onSubmit,
}: UseUserFormArgs) {
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
    defaultValues: USER_FORM_DEFAULT_VALUES,
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
      ...USER_FORM_DEFAULT_VALUES,
      ...initialValues,
      role: initialValues?.role || (canCreateAdmin ? ROLE.BOARD_MEMBER : ROLE.PARENT),
      communityId: canSelectCommunity
        ? initialValues?.communityId || ""
        : forcedCommunityId || initialValues?.communityId || "",
      children: [],
      address: {
        streetLine1: initialValues?.address?.streetLine1 || "",
        streetLine2: initialValues?.address?.streetLine2 || "",
        postalCode: initialValues?.address?.postalCode || "",
        city: initialValues?.address?.city || "",
        state: initialValues?.address?.state || "",
        country: initialValues?.address?.country || "",
      },
    });
  }, [open, initialValues, reset, canCreateAdmin, canSelectCommunity, forcedCommunityId]);

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

  const submit = handleSubmit((values) => {
    setServerError(null);
    clearErrors();

    const normalizedValues: UserFormValues = {
      ...values,
      role: !canCreateAdmin && values.role === ROLE.ADMIN ? ROLE.BOARD_MEMBER : values.role,
      communityId: canSelectCommunity ? values.communityId : forcedCommunityId || values.communityId,
    };
    const parsed = userFormSchema.safeParse(normalizedValues);
    const communityMissing = mode === "create" && !normalizedValues.communityId;

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const [field] = issue.path;
        if (!field || typeof field !== "string") continue;

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

        if (field === "children" && typeof issue.path[1] === "number" && typeof issue.path[2] === "string") {
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

    if (!parsed.success || communityMissing) return;

    setSubmitLocked(true);
    onSubmit(parsed.data);
  });

  return {
    register,
    clearErrors,
    errors,
    serverError,
    submitLocked,
    submit,
    fields,
    append,
    remove,
  };
}
