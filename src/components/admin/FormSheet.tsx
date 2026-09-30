import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/**
 * Right-hand form panel. Wraps children in a <form>; the footer has Cancel
 * and a submit button that shows progress while `saving`.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  saving,
  submitText = 'Save',
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void | Promise<void>;
  saving?: boolean;
  submitText?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={wide ? 'w-full sm:max-w-2xl' : 'w-full sm:max-w-lg'}>
        <form
          className="flex h-full flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <div className="-mx-6 flex-1 space-y-4 overflow-y-auto px-6 py-5">{children}</div>
          <SheetFooter className="gap-2 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : submitText}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
