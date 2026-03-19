import { Loader } from "./loader";

type TableLoadingRowProps = {
  colSpan: number;
  text: string;
};

export function TableLoadingRow({ colSpan, text }: TableLoadingRowProps) {
  return (
    <tr>
      <td className="px-4 py-6 text-center text-slate-500" colSpan={colSpan}>
        <Loader size="xs" text={text} className="justify-center" />
      </td>
    </tr>
  );
}
