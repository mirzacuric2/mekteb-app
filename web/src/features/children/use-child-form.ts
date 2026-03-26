import { useForm } from "react-hook-form";
import { childFormSchema, CHILD_FORM_DEFAULT_VALUES, ChildFormValues } from "./child-form-schema";

type UseChildFormArgs = {
  canAdminManage: boolean;
  canChooseCommunity: boolean;
  childrenCommunityRequiredMessage: string;
  childrenParentsRequiredMessage: string;
  childrenProgramsRequiredMessage: string;
  onSubmit: (values: ChildFormValues) => void;
};

export function useChildForm({
  canAdminManage,
  canChooseCommunity,
  childrenCommunityRequiredMessage,
  childrenParentsRequiredMessage,
  childrenProgramsRequiredMessage,
  onSubmit,
}: UseChildFormArgs) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<ChildFormValues>({
    defaultValues: CHILD_FORM_DEFAULT_VALUES,
  });

  const submit = handleSubmit((values) => {
    clearErrors();

    const parsed = childFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof ChildFormValues, { type: "manual", message: issue.message });
        }
      }
      return;
    }

    if (canChooseCommunity && !values.communityId.trim()) {
      setError("communityId", { type: "manual", message: childrenCommunityRequiredMessage });
      return;
    }
    if (canAdminManage && values.parentIds.length === 0) {
      setError("parentIds", { type: "manual", message: childrenParentsRequiredMessage });
      return;
    }
    if (canAdminManage && values.programs.length === 0) {
      setError("programs", { type: "manual", message: childrenProgramsRequiredMessage });
      return;
    }

    onSubmit(values);
  });

  return {
    register,
    setValue,
    watch,
    reset,
    clearErrors,
    errors,
    submit,
  };
}
