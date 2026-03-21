import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { AlertTriangle, GraduationCap, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { DiplomaSampleOutputPreview } from "../../diplomas/diploma-sample-output-preview";
import {
  DEFAULT_DIPLOMA_TEMPLATE_FILENAME,
  DEFAULT_DIPLOMA_TEMPLATE_PUBLIC_PATH,
  DIPLOMA_TEMPLATE_ERR_CUSTOM_NOT_FOUND,
  DIPLOMA_TEMPLATE_ERR_DEFAULT_ASSET,
} from "../../diplomas/diploma-template-constants";
import { DiplomaTemplateFileInput } from "../../diplomas/diploma-template-file-input";
import { DiplomaTemplatePreview } from "../../diplomas/diploma-template-preview";
import type { DiplomaTextLayout } from "../../diplomas/diploma-layout";
import type { CommunityRecord } from "../types";
import { communityDiplomaSettingsPayloadSchema } from "./community-diploma-schema";
import { CommunityDiplomaGeneratePanel } from "./community-diploma-generate-panel";
import { CommunityDiplomaLayoutAdvanced } from "./community-diploma-layout-advanced";
import { formatDiplomaImamLineFromPrimaryAdmin } from "./imam-line-from-admin";
import { mergeCommunityDiplomaLayout } from "./merge-community-diploma-layout";
import { useCommunityDiplomaMutations } from "./use-community-diploma-mutations";
import { useCommunityDiplomaTemplateBytes } from "./use-community-diploma-template-bytes";

type Props = {
  community: CommunityRecord;
};

function communityUsersFingerprint(users: CommunityRecord["users"]) {
  return JSON.stringify(
    [...(users ?? [])]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((u) => [u.id, u.firstName, u.lastName])
  );
}

function templateBytesFailureKind(error: unknown): "default-asset" | "custom-missing" | "generic" {
  if (error instanceof Error && error.message === DIPLOMA_TEMPLATE_ERR_DEFAULT_ASSET) return "default-asset";
  if (error instanceof Error && error.message === DIPLOMA_TEMPLATE_ERR_CUSTOM_NOT_FOUND) return "custom-missing";
  return "generic";
}

export function CommunityDiplomasTab({ community }: Props) {
  const { t } = useTranslation();
  const communityId = community.id;
  const hasCustom = community.hasCustomDiplomaTemplate === true;

  const usersFingerprint = useMemo(() => communityUsersFingerprint(community.users), [community.users]);

  const primaryAdminImamLine = useMemo(() => formatDiplomaImamLineFromPrimaryAdmin(community.users), [usersFingerprint]);

  const resolvedDefaultImamLine = useMemo(() => {
    const saved = community.diplomaDefaultImamLine?.trim();
    if (saved) return saved;
    return primaryAdminImamLine;
  }, [community.diplomaDefaultImamLine, primaryAdminImamLine]);

  const [layoutDraft, setLayoutDraft] = useState<DiplomaTextLayout>(() =>
    mergeCommunityDiplomaLayout(community.diplomaLayoutJson)
  );
  const [defaultImamDraft, setDefaultImamDraft] = useState(resolvedDefaultImamLine);
  const [localPreviewBuffer, setLocalPreviewBuffer] = useState<ArrayBuffer | null>(null);
  const [pendingTemplateFile, setPendingTemplateFile] = useState<File | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  const bytesQuery = useCommunityDiplomaTemplateBytes(
    communityId,
    hasCustom,
    true
  );

  const { patchSettings, uploadTemplate, deleteTemplate } = useCommunityDiplomaMutations(communityId);

  useEffect(() => {
    setLayoutDraft(mergeCommunityDiplomaLayout(community.diplomaLayoutJson));
  }, [community.diplomaLayoutJson, community.id]);

  useEffect(() => {
    setDefaultImamDraft(resolvedDefaultImamLine);
  }, [resolvedDefaultImamLine]);

  const previewBytes = useMemo(() => {
    if (localPreviewBuffer) return localPreviewBuffer;
    return bytesQuery.data ?? null;
  }, [bytesQuery.data, localPreviewBuffer]);

  const templateActiveSourceHint = useMemo(() => {
    if (bytesQuery.isError && !localPreviewBuffer) return undefined;
    if (pendingTemplateFile) {
      return t("communityDiplomaTemplateActivePending", { name: pendingTemplateFile.name });
    }
    if (hasCustom) {
      return t("communityDiplomaTemplateActiveSavedCustom");
    }
    return t("communityDiplomaTemplateActiveDefaultFile", { file: DEFAULT_DIPLOMA_TEMPLATE_FILENAME });
  }, [bytesQuery.isError, hasCustom, localPreviewBuffer, pendingTemplateFile, t]);

  const getApiMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }
    return fallback;
  };

  const onSaveLayout = () => {
    const payload = {
      layout: layoutDraft,
      defaultImamLine: defaultImamDraft.trim() ? defaultImamDraft.trim().slice(0, 200) : null,
    };
    const parsed = communityDiplomaSettingsPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(t("communityDiplomaLayoutInvalid"));
      return;
    }
    patchSettings.mutate(parsed.data, {
      onSuccess: () => toast.success(t("communityDiplomaLayoutSaved")),
      onError: (e) => toast.error(getApiMessage(e, t("communityDiplomaLayoutSaveFailed"))),
    });
  };

  const onPickLocalPdf = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      setLocalPreviewBuffer(buf);
      setPendingTemplateFile(file);
    } catch {
      toast.error(t("communityDiplomaPreviewLoadFailed"));
    }
  };

  const onApplyTemplate = () => {
    if (!pendingTemplateFile) {
      toast.error(t("communityDiplomaPickTemplateFirst"));
      return;
    }
    uploadTemplate.mutate(pendingTemplateFile, {
      onSuccess: () => {
        setPendingTemplateFile(null);
        setLocalPreviewBuffer(null);
        toast.success(t("communityDiplomaTemplateUploaded"));
      },
      onError: (e) => {
        const msg =
          e instanceof Error && e.message === "TEMPLATE_TOO_LARGE"
            ? t("diplomaTemplateTooLarge")
            : getApiMessage(e, t("communityDiplomaTemplateUploadFailed"));
        toast.error(msg);
      },
    });
  };

  const onRemoveTemplate = () => {
    deleteTemplate.mutate(undefined, {
      onSuccess: () => {
        setLocalPreviewBuffer(null);
        setPendingTemplateFile(null);
        toast.success(t("communityDiplomaTemplateRemoved"));
      },
      onError: (e) => toast.error(getApiMessage(e, t("communityDiplomaTemplateRemoveFailed"))),
    });
  };

  const templateBusy = uploadTemplate.isPending || deleteTemplate.isPending;

  const templateBytesUnavailable = Boolean(bytesQuery.isError && !localPreviewBuffer);
  const templateFailureKind = templateBytesUnavailable ? templateBytesFailureKind(bytesQuery.error) : null;
  const templateBytesLoading = bytesQuery.isPending && !localPreviewBuffer && !bytesQuery.isError;

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">{t("communityDiplomaTabIntroTitle")}</h3>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">{t("communityDiplomaTabIntroBody")}</p>
        </div>
        <Button type="button" className="shrink-0 gap-2 self-start sm:self-center" onClick={() => setGeneratorOpen(true)}>
          <GraduationCap className="h-4 w-4" aria-hidden />
          {t("communityDiplomaOpenGenerator")}
        </Button>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-900">{t("communityDiplomaTemplateCardTitle")}</h3>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">{t("communityDiplomaTemplateCardIntro")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>
            {hasCustom ? t("communityDiplomaUsingCustomTemplate") : t("communityDiplomaUsingDefaultTemplate")}
          </span>
        </div>

        {templateBytesLoading ? (
          <p className="text-xs text-slate-500">{t("communityDiplomaTemplateLoading")}</p>
        ) : null}

        {templateBytesUnavailable ? (
          <div
            className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
            role="alert"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <span>
              {templateFailureKind === "default-asset"
                ? t("communityDiplomaTemplateDefaultMissing", { path: DEFAULT_DIPLOMA_TEMPLATE_PUBLIC_PATH })
                : templateFailureKind === "custom-missing"
                  ? t("communityDiplomaTemplateCustomMissing")
                  : t("communityDiplomaTemplateBytesFailed")}
            </span>
          </div>
        ) : null}

        <DiplomaTemplateFileInput
          id="community-diploma-template-file"
          disabled={templateBusy}
          activeSourceHint={templateActiveSourceHint}
          onPick={onPickLocalPdf}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={templateBusy || !pendingTemplateFile}
                onClick={onApplyTemplate}
                className="inline-flex items-center gap-2"
              >
                <Upload className="h-4 w-4 shrink-0" aria-hidden />
                {uploadTemplate.isPending ? t("communityDiplomaUploading") : t("communityDiplomaApplyTemplate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={templateBusy || !hasCustom}
                onClick={onRemoveTemplate}
                className="inline-flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                {t("communityDiplomaRemoveTemplate")}
              </Button>
            </>
          }
        />
        {pendingTemplateFile ? (
          <p className="text-xs leading-relaxed text-slate-500">{t("communityDiplomaPendingTemplate", { name: pendingTemplateFile.name })}</p>
        ) : null}
      </Card>

      <Card className="min-w-0 space-y-5 overflow-x-hidden p-5 sm:p-6">
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-900">{t("communityDiplomaLayoutCardTitle")}</h3>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">{t("communityDiplomaLayoutCardIntro")}</p>
        </div>

        <div className="space-y-2 border-t border-border pt-5">
          <label htmlFor="cd-default-imam" className="block text-sm font-medium text-slate-800">
            {t("communityDiplomaDefaultImamLabel")}
          </label>
          <Input
            id="cd-default-imam"
            value={defaultImamDraft}
            onChange={(e) => setDefaultImamDraft(e.target.value)}
            placeholder={t("diplomaImamLinePlaceholder")}
            className="max-w-xl"
          />
          <p className="max-w-xl text-xs leading-relaxed text-slate-500">{t("communityDiplomaDefaultImamHint")}</p>
        </div>

        <div className="space-y-5 border-t border-border pt-5">
          <DiplomaTemplatePreview
            layout={layoutDraft}
            onLayoutChange={setLayoutDraft}
            pdfBytes={previewBytes}
            showCopySnippet={false}
          />

          <CommunityDiplomaLayoutAdvanced layout={layoutDraft} onLayoutChange={setLayoutDraft} />

          {previewBytes ? <DiplomaSampleOutputPreview pdfBytes={previewBytes} layout={layoutDraft} /> : null}

          <div className="border-t border-border pt-5">
            <Button type="button" onClick={onSaveLayout} disabled={patchSettings.isPending}>
              {patchSettings.isPending ? t("communityDiplomaSaving") : t("communityDiplomaSaveLayout")}
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="max-w-2xl">
          <CommunityDiplomaGeneratePanel
            dialogLayout
            communityId={communityId}
            textLayout={layoutDraft}
            templateBytes={previewBytes}
            defaultImamLineFromSettings={resolvedDefaultImamLine}
            templateLoading={bytesQuery.isLoading && !localPreviewBuffer}
            active={generatorOpen}
            onCancel={() => setGeneratorOpen(false)}
            onGenerateComplete={() => setGeneratorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
