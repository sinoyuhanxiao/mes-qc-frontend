// qcSummaryService.js
// This file provides API functions to access QC Summary backend endpoints powered by FastAPI.
// It reads the base URL from VITE_QC_SUMMARY_API (configured per environment in .env files).

import axios from 'axios';

// Base URL for QC Summary APIs, e.g., http://localhost:8000/summary
const BASE_URL = import.meta.env.VITE_QC_SUMMARY_API + '/summary';

/**
 * 获取按日期的批次合格率趋势数据
 * @param {Object} params - { start_date, end_date, team_id, shift_id, product_id, batch_id }
 * @returns {Promise} Axios response with daily pass rate data
 */
export const getPassRateByDay = (params) => {
    return axios.get(`${BASE_URL}/pass-rate-by-day`, { params });
};

/**
 * 获取各班组的异常字段统计数据
 * @param {Object} params - Filtering options
 * @returns {Promise} Axios response with team-level abnormal stats
 */
export const getAbnormalByTeam = (params) => {
    return axios.get(`${BASE_URL}/abnormal-by-team`, { params });
};

/**
 * 获取字段级别的异常比例（用于饼图）
 * @param {Object} params - Filtering options
 * @returns {Promise} Axios response with abnormal ratio per field
 */
export const getAbnormalRatioByField = (params) => {
    return axios.get(`${BASE_URL}/abnormal-ratio-by-field`, { params });
};

/**
 * 获取字段级别的异常比例（合并小于20%的为“其他”）
 * @param {Object} params - Filtering options
 * @returns {Promise} Axios response with grouped pie chart data
 */
export const getAbnormalRatioByFieldGrouped = (params) => {
    return axios.get(`${BASE_URL}/abnormal-ratio-by-field-grouped`, { params });
};

/**
 * 获取产品 × 时间维度的异常热力图数据
 * @param {Object} params - Filtering options
 * @returns {Promise} Axios response with heatmap data (date × product)
 */
export const getAbnormalHeatmap = (params) => {
    return axios.get(`${BASE_URL}/abnormal-heatmap`, { params });
};

/**
 * 获取每个产品的异常批次统计（异常率、批次数）
 * @param {Object} params - Filtering options
 * @returns {Promise} Axios response with product-level abnormal stats
 */
export const getAbnormalBatchesByProduct = (params) => {
    return axios.get(`${BASE_URL}/abnormal-batches-by-product`, { params });
};

/**
 * 获取各检验员的质检字段数量统计（用于人员对比）
 * @param {Object} params - Filtering options
 * @returns {Promise} Axios response with personnel inspection stats
 */
export const getInspectionCountByPersonnel = (params) => {
    return axios.get(`${BASE_URL}/inspection-count-by-personnel`, { params });
};
