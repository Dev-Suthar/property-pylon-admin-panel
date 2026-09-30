import { PageHeader } from '@/components/admin/PageHeader';
import { OptionListEditor } from '@/components/admin/OptionListEditor';

/** Platform-wide dropdown lists for the apps. */
export function MasterLists() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Master lists"
        description="Dropdowns in the apps (areas, amenities, lead sources, lost reasons…). Changes here apply to every company that has no list of its own."
      />
      <OptionListEditor />
    </div>
  );
}
