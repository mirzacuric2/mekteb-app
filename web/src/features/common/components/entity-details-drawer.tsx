import { X } from "lucide-react";
import { ReactNode } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../../../components/ui/drawer";

type EntityDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  headerSubline?: ReactNode;
  headerMeta?: ReactNode;
  description?: string;
  children: React.ReactNode;
};

export function EntityDetailsDrawer({
  open,
  onOpenChange,
  title,
  headerSubline,
  headerMeta,
  description,
  children,
}: EntityDetailsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent direction="right" className="max-w-2xl">
        <DrawerHeader className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <DrawerTitle className="mb-0">{title}</DrawerTitle>
              {headerMeta ? <span className="inline-flex shrink-0 items-center">{headerMeta}</span> : null}
            </div>
            {headerSubline ? <div className="mt-1">{headerSubline}</div> : null}
            {description ? <DrawerDescription className="mt-1.5">{description}</DrawerDescription> : null}
          </div>
          <DrawerClose className="rounded-md border border-border p-2">
            <X size={16} />
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
