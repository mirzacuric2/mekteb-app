import { Loader } from "./loader";

type TableLoadingRowProps = {
  colSpan: number;
  text: string;
};

export function TableLoadingRow({ colSpan, text }: TableLoadingRowProps) {
  return (
    <tr>
      <td className="!py-6 !text-center text-slate-500" colSpan={colSpan}>
        <Loader size="sm" text={text} className="justify-center" />
      </td>
    </tr>
  );
}
