import { OptionListEditor } from '@/components/admin/OptionListEditor';

/** This company's own dropdown lists (falls back to the platform lists). */
export default function ListsModule({ companyId }: { companyId: string }) {
  return <OptionListEditor companyId={companyId} />;
}
