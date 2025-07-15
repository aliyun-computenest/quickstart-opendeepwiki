'use client'

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { Descriptions } from '@/components/ui/descriptions';
import { message } from '@/components/ui/message';
import { Separator as Divider } from '@/components/ui/separator';
import { DirectoryTree } from '@/components/ui/tree';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SaveOutlined, FolderOutlined, FileOutlined, ExclamationCircleOutlined, DownloadOutlined, PlayCircleOutlined, CaretRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getDataset, deleteDataset, TrainingDataset, createTask, getTasks, FineTuningTask, getTask, deleteTask, startTask, startTaskStream, updateDataset } from '../../../../services/fineTuningService';
import { getRepositoryFiles, getRepositoryFileContent, saveRepositoryFileContent } from '../../../../services/repositoryService';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { useParams } from 'next/navigation';
import { Dropdown, Form, Menu, TextArea } from '@lobehub/ui';
import { Button } from '@/components/ui/button';
import { Space } from 'lucide-react';

// 定义文件树节点类型
interface TreeNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: TreeNode[];
  catalog?: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    deletedTime: string;
    dependentFile: string[];
    ducumentId: string;
    isCompleted: boolean;
    isDeleted: boolean;
    order: number;
    parentId: string;
    prompt: string;
    url: string;
    warehouseId: string;
  };
}

// 示例目录树结构
const defaultTreeData: TreeNode[] = [
  {
    title: '加载中...',
    key: 'loading',
    isLeaf: true,
  },
];

export default function DatasetDetailPage() {
  const params = useParams();
  const datasetId = params.id as string;
  const [dataset, setDataset] = useState<TrainingDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  // 添加仓库目录树相关状态
  const [treeData, setTreeData] = useState<TreeNode[]>(defaultTreeData);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState(false);
  const [editorId] = useState<string>('md-editor-rt-dataset');
  const [loadingTree, setLoadingTree] = useState(false);

  // 创建微调任务对话框相关状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [taskForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  // 微调任务列表相关状态
  const [tasksList, setTasksList] = useState<FineTuningTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // 任务详情相关状态
  const [taskDetails, setTaskDetails] = useState<FineTuningTask | null>(null);
  const [isTaskDetailsModalVisible, setIsTaskDetailsModalVisible] = useState(false);
  const [taskDetailsLoading, setTaskDetailsLoading] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [startingTask, setStartingTask] = useState(false);

  // 启动任务相关状态
  const [taskProgress, setTaskProgress] = useState<string>('');
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);

  // 添加对进度容器的引用
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // 添加导出相关状态
  const [exportLoading, setExportLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState('llamaFactory');
  const [exportContent, setExportContent] = useState('');

  // 添加整体数据集导出相关状态
  const [entireDatasetContent, setEntireDatasetContent] = useState<string>('');
  const [entireDatasetLoading, setEntireDatasetLoading] = useState(false);

  // 添加新的微调任务界面相关状态
  const [isAdvancedStartModalVisible, setIsAdvancedStartModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [finetunedResult, setFinetunedResult] = useState<string>('');
  const [datasetContent, setDatasetContent] = useState<string>('');
  const [isFinetuning, setIsFinetuning] = useState(false);
  const [taskPrompt, setTaskPrompt] = useState<string>('');

  // 添加提示词相关状态
  const [promptText, setPromptText] = useState<string>('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  // 加载数据集详情
  const fetchDataset = async () => {
    setLoading(true);
    setSelectedFile(null);
    setSelectedCatalog(null);
    setFileContent('');
    try {
      const { data } = await getDataset(datasetId);
      if (data.code === 200) {
        setDataset(data.data);
        // 设置提示词内容
        if (data.data.prompt) {
          setPromptText(data.data.prompt);
        }

        // 如果数据集有关联的仓库ID，则加载仓库文件目录
        if (data.data.warehouseId) {
          await fetchRepositoryFiles(data.data.warehouseId);
        }
      } else {
        message.error(data.error || '获取数据集详情失败');
      }
    } catch (error) {
      console.error('获取数据集详情失败:', error);
      message.error('获取数据集详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载仓库文件目录
  const fetchRepositoryFiles = async (warehouseId: string) => {
    if (!warehouseId) return;

    setLoadingTree(true);
    try {
      const filesResponse = await getRepositoryFiles(warehouseId);
      if (filesResponse.code === 200 && filesResponse.data) {
        setTreeData(filesResponse.data);
      } else {
        message.error(filesResponse.message || '获取文件目录结构失败');
      }
    } catch (error) {
      console.error('加载文件目录失败:', error);
      message.error('加载文件目录失败');
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [datasetId]);

  // 返回列表页
  const handleBack = () => {
    router.push('/admin/finetune');
  };

  // 编辑数据集
  const handleEdit = () => {
    router.push(`/admin/finetune/dataset/${datasetId}/edit`);
  };

  // 删除数据集
  const handleDelete = async () => {
    Modal.confirm({
      title: '删除确认',
      content: '确定要删除此数据集吗？此操作不可撤销。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setDeleting(true);
        try {
          const response = await deleteDataset(datasetId);
          if (response.success) {
            message.success('数据集删除成功');
            router.push('/admin/finetune');
          } else {
            message.error(response.error || '删除数据集失败');
          }
        } catch (error) {
          console.error('删除数据集失败:', error);
          message.error('删除数据集失败');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  // 获取目录下的微调任务列表
  const fetchTasksList = async (warehouseId: string) => {
    if (!warehouseId) return;

    setTasksLoading(true);
    try {
      const { data } = await getTasks(warehouseId);
      if (data.code === 200) {
        setTasksList(data.data);
      } else {
        message.error(data.message || '获取微调任务列表失败');
      }
    } catch (error) {
      console.error('获取微调任务列表失败:', error);
      message.error('获取微调任务列表失败');
    } finally {
      setTasksLoading(false);
    }
  };

  // 处理文件选择
  const handleSelectFile = async (selectedKeys: React.Key[], info: any) => {
    if (selectedKeys.length > 0) {
      const filePath = selectedKeys[0] as string;
      setSelectedFile(filePath);
      setSelectedCatalog(info.node);

      try {
        setFileLoading(true);
        if (dataset?.warehouseId) {
          await fetchTasksList(dataset.warehouseId);
        }
      } catch (error) {
        console.error('获取文件内容失败:', error);
        message.error('获取文件内容失败');
        setFileContent('// 获取文件内容失败');
      } finally {
        setFileLoading(false);
      }
    }
  };

  // 打开创建微调任务对话框
  const handleCreateTask = () => {
    if (!selectedCatalog) return;

    // 预设表单数据
    taskForm.setFieldsValue({
      name: `微调任务 - ${selectedCatalog.title}`,
      description: `基于 ${selectedCatalog.title} 的微调任务`
    });

    setIsModalVisible(true);
  };

  // 提交创建微调任务
  const handleSubmitTask = async (values: any) => {
    if (!dataset || !selectedCatalog?.catalog?.id) return;

    setCreating(true);
    try {
      const taskData = {
        trainingDatasetId: datasetId,
        documentCatalogId: selectedCatalog.catalog.id,
        name: values.name,
        description: values.description
      };

      const { data } = await createTask(taskData);
      if (data.code === 200) {
        message.success('微调任务创建成功');
        setIsModalVisible(false);
        taskForm.resetFields();

        // 刷新任务列表
        if (dataset.warehouseId) {
          await fetchTasksList(dataset.warehouseId);
        }
      } else {
        message.error(data.message || '创建微调任务失败');
      }
    } catch (error) {
      console.error('创建微调任务失败:', error);
      message.error('创建微调任务失败');
    } finally {
      setCreating(false);
    }
  };

  // 取消创建微调任务
  const handleCancelTask = () => {
    setIsModalVisible(false);
    taskForm.resetFields();
  };

  // 渲染状态标签
  const renderStatus = (status: number) => {
    let color = 'blue';
    let text = '准备就绪';

    switch (status) {
      case 0:
        color = 'green';
        text = '未开始';
        break;
      case 1:
        color = 'blue';
        text = '进行中';
        break;
      case 2:
        color = 'blue';
        text = '已完成';
        break;
      case 3:
        color = 'red';
        text = '失败';
        break;
      default:
        color = 'default';
        text = '未知';
    }
    return <Tag>{text}</Tag>;
  };

  // 对API密钥进行脱敏处理
  const maskApiKey = (apiKey: string | undefined) => {
    if (!apiKey) return '-';
    if (apiKey.length <= 8) return '********';
    return apiKey.substring(0, 4) + '********' + apiKey.substring(apiKey.length - 4);
  };

  // 查看任务详情
  const handleViewTask = async (taskId: string) => {
    setTaskDetailsLoading(true);
    try {
      const { data } = await getTask(taskId);
      if (data.code === 200) {
        setTaskDetails(data.data);
        setIsTaskDetailsModalVisible(true);

        // 处理dataset字段，如果是JSON字符串则尝试解析
        if (data.data.dataset) {
          try {
            // 这里我们不进行解析，仅展示原始内容
            setFileContent(data.data.dataset);
          } catch (e) {
            console.error('解析数据集内容失败:', e);
            setFileContent('数据集内容解析失败');
          }
        } else {
          setFileContent('没有数据集内容');
        }
      } else {
        message.error(data.message || '获取任务详情失败');
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
      message.error('获取任务详情失败');
    } finally {
      setTaskDetailsLoading(false);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    Modal.confirm({
      title: '删除确认',
      content: '确定要删除此微调任务吗？此操作不可撤销。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setDeletingTask(true);
        try {
          const { data } = await deleteTask(taskId);
          if (data.code === 200) {
            message.success('微调任务删除成功');
            // 刷新任务列表
            if (dataset?.warehouseId) {
              await fetchTasksList(dataset.warehouseId);
            }
          } else {
            message.error(data.message || '删除微调任务失败');
          }
        } catch (error) {
          console.error('删除微调任务失败:', error);
          message.error('删除微调任务失败');
        } finally {
          setDeletingTask(false);
        }
      }
    });
  };

  // 启动任务 - 新的高级界面
  const handleAdvancedStartTask = async (taskId: string, taskStatus: number) => {
    if (taskStatus === 1) {
      message.warning('任务正在运行中，请稍后再试');
      return;
    }

    setSelectedTaskId(taskId);

    // 获取任务详情和数据集内容
    try {
      setTaskDetailsLoading(true);
      const { data } = await getTask(taskId);
      if (data.code === 200) {
        setTaskDetails(data.data);

        // 设置数据集内容用于显示
        if (data.data.dataset) {
          try {
            setDatasetContent(data.data.dataset);
          } catch (e) {
            console.error('解析数据集内容失败:', e);
            setDatasetContent('数据集内容解析失败');
          }
        } else {
          setDatasetContent('没有数据集内容');
        }

        // 设置提示词（如果任务中有提示词则使用任务提示词，否则使用数据集提示词）
        setTaskPrompt(data.data.prompt || promptText || '');

        // 打开高级启动界面
        setIsAdvancedStartModalVisible(true);
      } else {
        message.error(data.message || '获取任务详情失败');
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
      message.error('获取任务详情失败');
    } finally {
      setTaskDetailsLoading(false);
    }
  };

  // 开始微调 - 在高级界面中
  const handleStartFinetuning = async () => {
    if (!selectedTaskId) return;

    setIsFinetuning(true);
    setFinetunedResult('');
    let progress = '';

    try {
      // 使用流式API获取实时更新，并传入当前提示词
      const stream = await startTaskStream(selectedTaskId, taskPrompt);

      for await (const chunk of stream) {
        if (chunk.type === 'start') {
          progress += chunk.content + '\n';
          setTaskProgress(progress);
        } else if (chunk.type === 'progress') {
          progress += chunk.content;
          setTaskProgress(progress);
        } else if (chunk.type === 'complete') {
          progress += chunk.content;
          setTaskProgress(progress);
          message.success(chunk.content);
        } else if (chunk.type === 'error') {
          progress += chunk.content;
          setTaskProgress(progress);
          message.error(chunk.content);
        }
      }

      // 刷新任务列表
      if (dataset?.warehouseId) {
        await fetchTasksList(dataset.warehouseId);
      }
    } catch (error) {
      setTaskProgress(progress);
    } finally {
      setIsFinetuning(false);
    }
  };

  // 立即启动任务 - 不显示界面，直接后台执行
  const handleImmediateStartTask = async (taskId: string, taskStatus: number) => {
    if (taskStatus === 1) {
      message.warning('任务正在运行中，请稍后再试');
      return;
    }
    await startTask(taskId);
  };

  // 关闭高级启动界面
  const handleCloseAdvancedStartModal = () => {
    if (isFinetuning) {
      message.warning('任务正在微调中，请稍后再关闭');
      return;
    }

    setIsAdvancedStartModalVisible(false);
    setSelectedTaskId(null);
    setTaskProgress('');
    setFinetunedResult('');
    setDatasetContent('');
    setTaskPrompt('');
  };

  // 关闭任务详情对话框
  const handleCloseTaskDetails = () => {
    setIsTaskDetailsModalVisible(false);
    setTaskDetails(null);
  };

  // 关闭微调进度对话框
  const handleCloseProgressModal = () => {
    if (startingTask) {
      message.warning('任务正在启动中，请稍后再关闭');
      return;
    }

    setIsProgressModalVisible(false);
    // 延迟清空进度记录，以避免弹窗关闭时的视觉跳跃
    setTimeout(() => {
      setTaskProgress('');
    }, 300);
  };

  // 导出数据集函数
  const exportDataset = (format: string, dataset: string) => {
    if (!dataset) {
      message.error('没有可导出的数据');
      return;
    }

    try {
      // 尝试解析数据集内容
      let parsedData;
      try {
        parsedData = JSON.parse(dataset);
      } catch (e) {
        message.error('数据集格式无效，无法导出');
        return;
      }

      let exportData;
      switch (format) {
        case 'llamaFactory':
          // LLaMA-Factory 格式
          exportData = parsedData.map((item: any) => ({
            instruction: item.instruction || "",
            input: item.input || "",
            output: item.output || ""
          }));
          break;
        case 'alpaca':
          // Alpaca 格式
          exportData = parsedData.map((item: any) => ({
            instruction: item.instruction || "",
            input: item.input || "",
            output: item.output || "",
            text: `${item.instruction || ""}${item.input ? "\n\n" + item.input : ""}\n\n${item.output || ""}`
          }));
          break;
        case 'chatML':
          // ChatML 格式
          exportData = parsedData.map((item: any) => ({
            messages: [
              { role: "system", content: item.instruction || "" },
              { role: "user", content: item.input || "" },
              { role: "assistant", content: item.output || "" }
            ]
          }));
          break;
        default:
          exportData = parsedData;
      }

      setExportContent(JSON.stringify(exportData, null, 2));
      setExportFormat(format);
      setExportModalVisible(true);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 下载导出的文件
  const downloadExportFile = () => {
    if (!exportContent) {
      message.error('没有内容可下载');
      return;
    }

    setExportLoading(true);
    try {
      const blob = new Blob([exportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      let formatSuffix = '';

      switch (exportFormat) {
        case 'llamaFactory':
          formatSuffix = 'llama-factory';
          break;
        case 'alpaca':
          formatSuffix = 'alpaca';
          break;
        case 'chatML':
          formatSuffix = 'chatml';
          break;
        default:
          formatSuffix = 'json';
      }

      a.href = url;
      a.download = `dataset-export-${formatSuffix}-${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('文件下载成功');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 修改任务详情对话框
  const handleExportDataset = (format: string) => {
    if (taskDetails?.dataset) {
      exportDataset(format, taskDetails.dataset);
    } else {
      message.error('没有可导出的数据集内容');
    }
  };

  // 导出整体数据集
  const handleExportEntireDataset = async () => {
    if (!dataset || !dataset.warehouseId) {
      message.error('数据集不存在或未关联仓库');
      return;
    }

    setEntireDatasetLoading(true);
    try {
      // 获取所有微调任务数据
      const { data } = await getTasks(dataset.warehouseId);
      if (data.code !== 200 || !data.data) {
        throw new Error('获取任务数据失败');
      }

      // 合并所有任务数据
      let allDatasets: any[] = [];
      for (const task of data.data) {
        if (task.dataset) {
          try {
            const taskDataset = JSON.parse(task.dataset);
            if (Array.isArray(taskDataset)) {
              allDatasets = [...allDatasets, ...taskDataset];
            }
          } catch (e) {
            console.error(`解析任务 ${task.id} 的数据集失败:`, e);
          }
        }
      }

      if (allDatasets.length === 0) {
        message.warning('没有找到可用的数据集内容');
        return;
      }

      // 设置导出内容为合并后的数据集
      setExportContent(JSON.stringify(allDatasets, null, 2));
      setExportFormat('llamaFactory');
      setExportModalVisible(true);
      message.success(`成功合并 ${allDatasets.length} 条数据记录`);
    } catch (error) {
      console.error('导出整体数据集失败:', error);
      message.error('导出整体数据集失败');
    } finally {
      setEntireDatasetLoading(false);
    }
  };

  // 保存提示词
  const handleSavePrompt = async () => {
    if (!dataset) return;

    setSavingPrompt(true);
    try {
      const updateData = {
        datasetId: dataset.id,
        prompt: taskPrompt || promptText  // 优先使用弹窗中的提示词
      };

      const response = await updateDataset(updateData);
      if (response.success) {
        message.success('提示词更新成功');

        // 更新本地状态
        setPromptText(taskPrompt || promptText);

        // 重新加载数据集以获取最新数据
        await fetchDataset();
      } else {
        message.error(response.error || '更新提示词失败');
      }
    } catch (error) {
      console.error('更新提示词失败:', error);
      message.error('更新提示词失败');
    } finally {
      setSavingPrompt(false);
    }
  };

  // 定义表格列（用于参考，不再直接使用）
  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: renderStatus,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: FineTuningTask) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewTask(record.id)}
          >
            查看
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={() => handleDeleteTask(record.id)}
            disabled={deletingTask}
          >
            删除
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={record.status === 1}
              >
                {record.status === 1 ? '任务运行中' : '启动'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAdvancedStartTask(record.id, record.status)}>
                启动任务
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImmediateStartTask(record.id, record.status)}>
                立即启动
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Skeleton className="w-32 h-32 mx-auto" />
        <div style={{ marginTop: '20px' }}>加载数据集详情...</div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: '16px' }}>
          返回
        </Button>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <span>未找到数据集或数据集已删除</span>
            <div style={{ marginTop: '20px' }}>
              <Button onClick={handleBack}>
                返回列表
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 使用any类型获取额外字段
  const datasetWithExtras = dataset as any;

  // 导出菜单项
  const exportMenu = (
    <Menu onClick={({ key }) => handleExportDataset(key as string)} items={[
      {
        key: 'llamaFactory',
        label: 'LLaMA-Factory 格式',
      },
      {
        key: 'alpaca',
        label: 'Alpaca 格式',
      },
      {
        key: 'chatML',
        label: 'ChatML 格式',
      },
      {
        key: 'raw',
        label: '原始格式',
      },
    ]} />
  );

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button
            variant="outline"
            onClick={handleBack}
            style={{ marginRight: '8px' }}
            className="flex items-center"
          >
            <ArrowLeftOutlined className="mr-1" />
            返回
          </Button>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>数据集: {dataset.name}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportEntireDataset}
            disabled={entireDatasetLoading}
            className="flex items-center"
          >
            <DownloadOutlined className="mr-1" />
            导出整体数据集
          </Button>
          <Button
            variant="outline"
            onClick={fetchDataset}
            className="flex items-center"
          >
            <ReloadOutlined className="mr-1" />
            刷新
          </Button>
          <Button
            variant="default"
            onClick={handleEdit}
            className="flex items-center"
          >
            <EditOutlined className="mr-1" />
            编辑
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center"
          >
            <DeleteOutlined className="mr-1" />
            删除
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 220px)', minHeight: '400px' }}>
        <Card style={{ width: 300, marginRight: 16, height: '100%', overflow: 'auto' }}>
          {loadingTree ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Skeleton className="h-4 w-4 rounded-full" />
              <div style={{ marginTop: '10px' }}>加载目录中...</div>
            </div>
          ) : (
            <DirectoryTree
              defaultExpandAll
              treeData={treeData}
              onSelect={handleSelectFile}
              showIcon={true}
            />
          )}
        </Card>

        {/* 右侧文件内容 */}
        <Card style={{ flex: 1, height: '100%', overflow: 'auto' }}>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{selectedFile || '微调数据列表'}</CardTitle>
            {selectedFile && (
              <Button onClick={handleCreateTask} disabled={fileLoading}>
                创建微调任务
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {fileLoading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Skeleton className="h-32 w-full" />
                <div style={{ marginTop: '10px' }}>加载文件内容...</div>
              </div>
            ) : selectedFile ? (
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>关联的微调任务</div>
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2">加载中...</span>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>任务名称</TableHead>
                          <TableHead>创建时间</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasksList.filter(task => task.documentCatalogId === selectedCatalog?.catalog?.id).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">暂无关联的微调任务</TableCell>
                          </TableRow>
                        ) : (
                          tasksList
                            .filter(task => task.documentCatalogId === selectedCatalog?.catalog?.id)
                            .map((task) => (
                              <TableRow key={task.id}>
                                <TableCell>{task.name}</TableCell>
                                <TableCell>{new Date(task.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{renderStatus(task.status)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewTask(task.id)}
                                    >
                                      查看
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-500 hover:text-red-600"
                                      onClick={() => handleDeleteTask(task.id)}
                                      disabled={deletingTask}
                                    >
                                      删除
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={task.status === 1}
                                        >
                                          {task.status === 1 ? '任务运行中' : '启动'}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleAdvancedStartTask(task.id, task.status)}>
                                          启动任务
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleImmediateStartTask(task.id, task.status)}>
                                          立即启动
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <div>请从左侧选择一个文件来查看内容并创建微调任务</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 创建微调任务对话框 */}
      <Modal
        title="创建微调任务"
        open={isModalVisible}
        onCancel={handleCancelTask}
        footer={null}
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={handleSubmitTask}
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="输入微调任务名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <TextArea rows={4} placeholder="输入任务描述信息" />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                style={{ marginRight: '8px' }}
                onClick={handleCancelTask}
                type="button"
              >
                取消
              </Button>
              <Button
                variant="default"
                type="submit"
                disabled={creating}
              >
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情对话框 */}
      <Modal
        title="微调任务详情"
        open={isTaskDetailsModalVisible}
        onCancel={handleCloseTaskDetails}
        footer={
          <Space>
            <Button onClick={handleCloseTaskDetails}>
              关闭
            </Button>
          </Space>
        }
        width={800}
      >
        {taskDetailsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Skeleton />
            <div style={{ marginTop: '10px' }}>加载任务详情...</div>
          </div>
        ) : taskDetails ? (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="任务名称" span={2}>{taskDetails.name}</Descriptions.Item>
              <Descriptions.Item label="任务描述" span={2}>{taskDetails.description || '无'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{new Date(taskDetails.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="状态">{renderStatus(taskDetails.status)}</Descriptions.Item>
              <Descriptions.Item label="开始时间" span={2}>
                {taskDetails.startedAt ? new Date(taskDetails.startedAt).toLocaleString() : '未开始'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间" span={2}>
                {taskDetails.completedAt ? new Date(taskDetails.completedAt).toLocaleString() : '未完成'}
              </Descriptions.Item>
              {taskDetails.error && (
                <Descriptions.Item label="错误信息" span={2}>
                  <div style={{ color: 'red' }}>{taskDetails.error}</div>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider>数据集内容</Divider>
            <div style={{ maxHeight: '400px', overflow: 'auto', marginTop: '16px', border: '1px solid #e8e8e8', padding: '12px', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {taskDetails.dataset || '没有数据集内容'}
              </pre>
            </div>
          </div>
        ) : (
          <div>未找到任务详情</div>
        )}
      </Modal>

      {/* 微调任务进度对话框 */}
      <Modal
        title="微调任务进度"
        open={isProgressModalVisible}
        onCancel={handleCloseProgressModal}
        footer={[
          <Button key="close" onClick={handleCloseProgressModal}>
            关闭
          </Button>
        ]}
        width="100%"

      >
        <div
          ref={progressContainerRef}
          style={{
            maxHeight: '400px',
            overflow: 'auto',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {taskProgress}
        </div>
      </Modal>

      {/* 导出数据集对话框 */}
      <Modal
        title={`导出数据集 - ${exportFormat === 'llamaFactory' ? 'LLaMA-Factory' :
          exportFormat === 'alpaca' ? 'Alpaca' :
            exportFormat === 'chatML' ? 'ChatML' : '原始'} 格式`}
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={downloadExportFile}
          >
            下载
          </Button>,
          <Button key="close" onClick={() => setExportModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button
              onClick={() => handleExportDataset('llamaFactory')}
            >
              LLaMA-Factory
            </Button>
            <Button
              onClick={() => handleExportDataset('alpaca')}
            >
              Alpaca
            </Button>
            <Button
              onClick={() => handleExportDataset('chatML')}
            >
              ChatML
            </Button>
            <Button
              onClick={() => handleExportDataset('raw')}
            >
              原始格式
            </Button>
          </Space>
        </div>

        <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #e8e8e8', padding: '12px', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {exportContent}
          </pre>
        </div>
      </Modal>

      {/* 高级启动微调任务对话框 */}
      <Modal
        title="微调任务"
        open={isAdvancedStartModalVisible}
        onCancel={handleCloseAdvancedStartModal}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ height: '90vh', overflow: 'hidden' }}
      >
        {taskDetailsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Skeleton />
            <div style={{ marginTop: '10px' }}>加载任务详情...</div>
          </div>
        ) : (
          <div style={{ height: '100%' }}>
            <div className="grid grid-cols-2 gap-4" style={{ height: '100%' }}>
              <div className="col-span-1" style={{ height: '100%' }}>
                <div style={{ marginBottom: '16px', height: '100%' }}>
                  <div style={{ position: 'relative', height: '100%' }}>
                    <TextArea
                      value={taskPrompt}
                      onChange={(e) => setTaskPrompt(e.target.value)}
                      rows={4}
                      placeholder="输入用于微调的提示词模板，使用{{markdown_content}}作为特殊变量"
                      style={{
                        resize: 'none',
                        width: '100%',
                        height: '100%',
                        fontFamily: 'monospace',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 2,
                        backgroundColor: 'transparent',
                        caretColor: '#000'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 右侧 - 微调结果 */}
              <div className="col-span-1" style={{ height: '100%' }}>
                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>微调进度</CardTitle>
                    <Button onClick={handleStartFinetuning} loading={isFinetuning} disabled={isFinetuning} className="shrink-0">
                      <CaretRightOutlined className="mr-1" />
                      开始微调
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    <div
                      style={{
                        flex: 1,
                        overflow: 'auto',
                        border: '1px solid #e8e8e8',
                        borderRadius: '4px',
                        backgroundColor: '#f5f5f5',
                        padding: '12px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}
                    >
                      {taskProgress || '点击"开始微调"开始执行任务...'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button onClick={handleCloseAdvancedStartModal}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 