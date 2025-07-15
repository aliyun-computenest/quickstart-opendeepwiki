import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye, Edit } from 'lucide-react';
import { DocumentContent } from './document';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  document: any;
  owner: string;
  name: string;
  token: any;
}

/**
 * Markdown编辑器组件
 * 支持编辑和预览Markdown内容
 */
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave,
  document,
  owner,
  name,
  token
}) => {
  const [activeTab, setActiveTab] = useState<string>('edit');

  // 处理内容变更
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Markdown编辑器</span>
          <Button onClick={onSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            保存
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                编辑
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                预览
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit">
            <Textarea
              value={content}
              onChange={handleContentChange}
              className="min-h-[500px] font-mono text-sm leading-relaxed resize-none"
              placeholder="在此输入 Markdown 内容..."
            />
          </TabsContent>

          <TabsContent value="preview">
            <div className="h-[500px] overflow-auto border rounded-md p-4">
              {activeTab === 'preview' && (
                <DocumentContent
                  document={{
                    ...document,
                    content
                  }}
                  owner={owner}
                  name={name}
                  token={token}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarkdownEditor; 