'use client'

import { fetchApi, ApiResponse, API_URL, fetchSSE } from './api';

/**
 * 训练数据集接口
 */
export interface TrainingDataset {
    id: string;
    name: string;
    description?: string;
    warehouseId: string;
    fileCount: number;
    status: number;
    createdAt: string;
    updatedAt?: string;
}

/**
 * 创建数据集输入接口
 */
export interface CreateDatasetInput {
    name: string;
    warehouseId: string;
    endpoint: string;
    apiKey: string;
    prompt: string;
    model: string;
}

/**
 * 更新数据集输入接口
 */
export interface UpdateDatasetInput {
    datasetId: string;
    name?: string;
    endpoint?: string;
    apiKey?: string;
    prompt?: string;
    model?: string;
}

/**
 * 微调任务接口
 */
export interface FineTuningTask {
    id: string;
    warehouseId: string;
    trainingDatasetId: string;
    documentCatalogId: string;
    name: string;
    userId: string;
    description: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    status: FineTuningTaskStatus;
    dataset: string;
    error: string | null;
    originalDataset: string | null;
}

export enum FineTuningTaskStatus {
    NotStarted = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3,
    Cancelled = 4
}
/**
 * 创建微调任务输入接口
 */
export interface CreateTaskInput {
    trainingDatasetId: string;
    documentCatalogId: string;
    name: string;
    description: string;
}

/**
 * 创建训练数据集
 */
export async function createDataset(data: CreateDatasetInput): Promise<ApiResponse<TrainingDataset>> {
    return fetchApi<TrainingDataset>(API_URL + '/api/FineTuning/Dataset', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * 获取训练数据集详情
 */
export async function getDataset(datasetId: string): Promise<any> {
    return fetchApi<TrainingDataset>(API_URL + '/api/FineTuning/Dataset?datasetId=' + datasetId, {
        method: 'GET',
        cache: 'no-store'
    });
}

/**
 * 更新训练数据集
 */
export async function updateDataset(data: UpdateDatasetInput): Promise<ApiResponse<TrainingDataset>> {
    return fetchApi<TrainingDataset>(API_URL + '/api/FineTuning/Dataset', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * 删除训练数据集
 */
export async function deleteDataset(datasetId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(API_URL + '/api/FineTuning/Dataset?datasetId=' + datasetId, {
        method: 'DELETE',
    });
}

/**
 * 获取训练数据集列表
 */
export async function getDatasets(warehouseId: string): Promise<any> {
    return fetchApi<any>(API_URL + '/api/FineTuning/Datasets?warehouseId=' + warehouseId, {
        method: 'GET',
        cache: 'no-store'
    });
}

/**
 * 创建微调任务
 */
export async function createTask(data: CreateTaskInput): Promise<any> {
    return fetchApi<any>(API_URL + '/api/FineTuning/Task', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * 获取微调任务详情
 */
export async function getTask(taskId: string): Promise<any> {
    return fetchApi<any>(API_URL + '/api/FineTuning/Task?taskId=' + taskId, {
        method: 'GET',
        cache: 'no-store'
    });
}

/**
 * 删除微调任务
 */
export async function deleteTask(taskId: string): Promise<any> {
    return fetchApi<any>(API_URL + '/api/FineTuning/Task?taskId=' + taskId, {
        method: 'DELETE',
    });
}

/**
 * 获取微调任务列表
 */
export async function getTasks(warehouseId: string): Promise<any> {
    return fetchApi<any>(API_URL + '/api/FineTuning/Tasks?warehouseId=' + warehouseId, {
        method: 'GET',
        cache: 'no-store'
    });
}

/**
 * 启动微调任务
 */
export async function startTask(taskId: string, prompt?: string): Promise<any> {
    return fetchApi<any>(API_URL + '/api/FineTuning/StartTask', {
        method: 'POST',
        body: JSON.stringify({
            taskId: taskId,
            prompt: prompt
        })
    });
}

/**
 * 启动微调任务（流式）
 */
export async function startTaskStream(taskId: string, prompt?: string): Promise<AsyncIterableIterator<any>> {
    return fetchSSE(API_URL + '/api/FineTuning/StartTask', {
        taskId: taskId,
        prompt: prompt
    });
}

/**
 * 取消微调任务
 */
export async function cancelTask(taskId: string): Promise<any> {
    return fetchApi<any>(API_URL + '/api/FineTuning/CancelTask?taskId=' + taskId, {
        method: 'POST',
    });
}
