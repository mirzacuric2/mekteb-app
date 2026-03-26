import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { CalendarPlus2, PencilLine, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Checkbox } from "../../components/ui/checkbox";
import { LESSON_NIVO_ORDER } from "../lessons/constants";
import {
  COMMUNITY_EVENT_DEFAULT_VALUES,
  createCommunityEventFormSchema,
  CommunityEventFormValues,
} from "./community-event-schema";
import { EVENT_AUDIENCE, EVENT_RECURRENCE, CommunityEventRecord, EventAudience } from "./types";
import { EVENT_AUDIENCE_ORDER } from "./constants";

const NIVO_OPTION_ICON: Record<number, string> = {
  1: "🟢",
  2: "🔵",
  3: "🟠",
  4: "🔴",
  5: "🟣",
};

type CommunityEventFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialEvent?: CommunityEventRecord | null;
  presetEventDate?: string | null;
  lockEventDate?: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CommunityEventFormValues) => void;
};

function toIsoDateAndTime(value: string | Date): { eventDate: string; timeValue: string } | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
  const [eventDate, timeValue] = localDate.split("T");
  return {
    eventDate,
    timeValue,
  };
}

function toIsoDateTime(eventDate: string, timeValue: string) {
  const date = new Date(`${eventDate}T${timeValue}`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function getInitialValuesFromEvent(event: CommunityEventRecord): CommunityEventFormValues {
  const start = toIsoDateAndTime(event.startAt);
  const end = toIsoDateAndTime(event.endAt);
  return {
    title: event.title,
    description: event.description || "",
    eventDate: start?.eventDate || "",
    startTime: start?.timeValue || "",
    endTime: end?.timeValue || "",
    isWeeklyRecurring: event.recurrence === EVENT_RECURRENCE.WEEKLY,
    audience: event.audience,
    nivo: event.nivo || undefined,
  };
}

export function CommunityEventFormDialog({
  open,
  mode,
  initialEvent,
  presetEventDate,
  lockEventDate = false,
  submitting,
  onOpenChange,
  onSubmit,
}: CommunityEventFormDialogProps) {
  const { t } = useTranslation();
  const communityEventFormSchema = useMemo(
    () =>
      createCommunityEventFormSchema({
        titleMin: t("eventsValidationTitleMin"),
        dateRequired: t("eventsValidationDateRequired"),
        startTimeRequired: t("eventsValidationStartTimeRequired"),
        endTimeRequired: t("eventsValidationEndTimeRequired"),
        dateOrStartInvalid: t("eventsValidationDateOrStartInvalid"),
        endTimeInvalid: t("eventsValidationEndTimeInvalid"),
        endAfterStart: t("eventsValidationEndAfterStart"),
        nivoRequiredForAudience: t("eventsValidationNivoRequired"),
      }),
    [t]
  );
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CommunityEventFormValues>({
    defaultValues: COMMUNITY_EVENT_DEFAULT_VALUES,
  });

  const audience = watch("audience");
  const selectedNivo = watch("nivo");

  useEffect(() => {
    if (!open) return;
    if (!initialEvent) {
      reset({
        ...COMMUNITY_EVENT_DEFAULT_VALUES,
        eventDate: presetEventDate || COMMUNITY_EVENT_DEFAULT_VALUES.eventDate,
      });
      return;
    }
    reset(getInitialValuesFromEvent(initialEvent));
  }, [open, initialEvent, presetEventDate, reset]);

  useEffect(() => {
    if (audience !== EVENT_AUDIENCE.ILMIHAL && audience !== EVENT_AUDIENCE.NIVO) {
      setValue("nivo", undefined, { shouldDirty: false });
    }
  }, [audience, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]">
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit((values) => {
            clearErrors();
            const parsed = communityEventFormSchema.safeParse(values);
            if (!parsed.success) {
              for (const issue of parsed.error.issues) {
                const [field] = issue.path;
                if (!field) continue;
                if (typeof field === "string") {
                  setError(field as keyof CommunityEventFormValues, { type: "manual", message: issue.message });
                }
              }
              return;
            }
            onSubmit(parsed.data);
          })}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === "create" ? <CalendarPlus2 className="h-4 w-4 text-slate-500" /> : <PencilLine className="h-4 w-4 text-slate-500" />}
              <span>{mode === "create" ? t("eventsCreateEvent") : t("eventsUpdateEvent")}</span>
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("eventsTitleLabel")}</label>
              <Input {...register("title", { onChange: () => clearErrors("title") })} />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("eventsDescriptionLabel")}</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-ring"
                placeholder={t("eventsDescriptionPlaceholder")}
              />
              {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {lockEventDate ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("eventsDateLabel")}</label>
                  <div className="flex h-10 items-center rounded-md border border-input bg-slate-50 px-3 text-sm text-slate-700">
                    {watch("eventDate")}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("eventsDateLabel")}</label>
                  <Input type="date" {...register("eventDate", { onChange: () => clearErrors("eventDate") })} />
                  {errors.eventDate ? <p className="mt-1 text-xs text-red-600">{errors.eventDate.message}</p> : null}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("eventsStartLabel")}</label>
                <Input type="time" step={300} {...register("startTime", { onChange: () => clearErrors("startTime") })} />
                {errors.startTime ? <p className="mt-1 text-xs text-red-600">{errors.startTime.message}</p> : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("eventsEndLabel")}</label>
                <Input type="time" step={300} {...register("endTime", { onChange: () => clearErrors("endTime") })} />
                {errors.endTime ? <p className="mt-1 text-xs text-red-600">{errors.endTime.message}</p> : null}
              </div>
              <div>
                <label className="inline-flex h-10 items-center gap-2 whitespace-nowrap text-sm text-slate-700 sm:pb-[2px]">
                  <Checkbox
                    checked={watch("isWeeklyRecurring")}
                    onCheckedChange={(checked) => {
                      setValue("isWeeklyRecurring", Boolean(checked), { shouldDirty: true });
                    }}
                  />
                  {t("eventsWeeklyRecurringCheckbox")}
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("eventsAudienceLabel")}</label>
              <Select
                name="audience"
                value={audience}
                onChange={(event) => {
                  setValue("audience", event.target.value as EventAudience, { shouldDirty: true });
                  clearErrors("audience");
                }}
              >
                {EVENT_AUDIENCE_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {t(`eventsAudience${value}`)}
                  </option>
                ))}
              </Select>
            </div>
            {audience === EVENT_AUDIENCE.ILMIHAL || audience === EVENT_AUDIENCE.NIVO ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("level")}</label>
                <Select
                  name="nivo"
                  value={selectedNivo ? String(selectedNivo) : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setValue("nivo", value === "" ? undefined : Number(value), { shouldDirty: true });
                    clearErrors("nivo");
                  }}
                >
                  <option value="">{t("eventsSelectNivo")}</option>
                  {LESSON_NIVO_ORDER.map((value) => (
                    <option key={value} value={value}>
                      {`${NIVO_OPTION_ICON[value]} ${t("childrenNivoLabel")} ${value}`}
                    </option>
                  ))}
                </Select>
                {errors.nivo ? <p className="mt-1 text-xs text-red-600">{errors.nivo.message}</p> : null}
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="mr-1 h-4 w-4" />
              {mode === "create" ? t("eventsCreateEvent") : t("eventsSaveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function mapEventFormValuesToCreatePayload(values: CommunityEventFormValues) {
  const startAt = toIsoDateTime(values.eventDate, values.startTime);
  const endAt = toIsoDateTime(values.eventDate, values.endTime);
  return {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    startAt,
    endAt,
    recurrence: values.isWeeklyRecurring ? EVENT_RECURRENCE.WEEKLY : EVENT_RECURRENCE.NONE,
    recurrenceInterval: 1,
    recurrenceEndsAt: undefined,
    audience: values.audience,
    childIds: [],
    nivo: values.audience === EVENT_AUDIENCE.NIVO || values.audience === EVENT_AUDIENCE.ILMIHAL ? values.nivo : undefined,
  };
}

export function mapEventFormValuesToUpdatePayload(values: CommunityEventFormValues) {
  const createPayload = mapEventFormValuesToCreatePayload(values);
  return {
    ...createPayload,
    recurrenceEndsAt: createPayload.recurrenceEndsAt ?? null,
    nivo: createPayload.nivo ?? null,
  };
}
