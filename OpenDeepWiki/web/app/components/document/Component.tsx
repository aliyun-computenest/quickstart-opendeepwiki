import { CollapsibleCard } from '@/components/ui/collapsible';
import { Brain } from 'lucide-react';
import { memo } from 'react';

const RenderThinking = memo<{ think: string }>(({ think }) => {
  return (
    <CollapsibleCard
      title={
        <div className="flex items-center gap-2 text-sm font-medium">
          <Brain size={14} />
          深入思考
        </div>
      }
      className="w-full mb-4"
    >
      <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
        {think}
      </div>
    </CollapsibleCard>
  );
});

RenderThinking.displayName = 'RenderThinking';

export default RenderThinking;