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
  headerMeta?: ReactNode;
  description?: string;
  children: React.ReactNode;
};

export function EntityDetailsDrawer({
  open,
  onOpenChange,
  title,
  headerMeta,
  description,
  children,
}: EntityDetailsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent direction="right">
        <DrawerHeader className="flex items-start justify-between gap-4">
          <div>
            <DrawerTitle>{title}</DrawerTitle>
            {headerMeta ? <div className="mt-2">{headerMeta}</div> : null}
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </div>
          <DrawerClose className="rounded-md border border-border p-2">
            <X size={16} />
          </DrawerClose>
        </DrawerHeader>
        <div className="space-y-4 p-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
