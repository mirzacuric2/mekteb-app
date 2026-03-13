import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";

type EntityRowActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export function EntityRowActions({ onEdit, onDelete }: EntityRowActionsProps) {
  return (
    <div className="flex w-full justify-end gap-2">
      <Button
        variant="outline"
        className="px-2"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        aria-label="Edit"
      >
        <Pencil size={16} />
      </Button>
      <Button
        variant="outline"
        className="px-2"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        aria-label="Delete"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
