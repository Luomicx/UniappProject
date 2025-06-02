<template>
	<view class="detection-history">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 返回按钮和标题 -->
		<view class="header">
			<view class="back-btn" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">检测历史</text>
			<view class="delete-btn" v-if="historyList.length > 0" @click="showDeleteConfirm">
				<u-icon name="trash" color="#FF5252" size="20"></u-icon>
			</view>
			<view class="placeholder" v-else></view>
		</view>

		<!-- 历史记录列表 -->
		<scroll-view scroll-y class="history-list" refresher-enabled @refresherrefresh="fetchHistory"
			:refresher-triggered="loading">
			<view v-if="loading" class="loading-state">
				<view class="loading-spinner"></view>
				<text>加载中...</text>
			</view>
			<view v-else-if="historyList.length === 0" class="empty-state">
				<u-icon name="photo" size="64" color="#CCCCCC"></u-icon>
				<text>暂无检测记录</text>
				<view class="empty-tip">拍照检测后的记录将显示在这里</view>
			</view>
			<view v-else class="list-content">
				<view class="list-header">
					<text class="record-count">共 {{ historyList.length }} 条记录</text>
					<view class="clear-all" @click="showDeleteConfirm">
						<u-icon name="trash" size="14" color="#FF5252"></u-icon>
						<text>清空记录</text>
					</view>
				</view>
				<view v-for="(item, index) in historyList" :key="index" class="history-item" @click="viewDetail(item)"
					@longpress="showDeleteItemConfirm(item)">
					<image :src="item.image" mode="aspectFill" class="item-image"></image>
					<view class="item-info">
						<view class="item-main">
							<text class="item-disease">{{ item.disease_name || '未知疾病' }}</text>
							<text class="item-confidence" v-if="item.confidence">
								可信度: {{ (item.confidence * 100).toFixed(2) }}%
							</text>
						</view>
						<view class="item-analysis" v-if="item.analysis">
							<text class="analysis-preview">{{ item.analysis.split('\n')[0] }}</text>
						</view>
						<view class="item-time">{{ formatDate(item.timestamp) }}</view>
					</view>
					<view class="arrow-icon">
						<u-icon name="arrow-right" color="#CCCCCC" size="20"></u-icon>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 自定义删除确认弹窗 -->
		<view class="custom-modal" v-if="showModal" @click.stop="cancelDelete">
			<view class="modal-content" @click.stop>
				<view class="modal-title">{{ deleteModalTitle }}</view>
				<view class="modal-text">{{ deleteModalContent }}</view>
				<view class="modal-buttons">
					<view class="modal-button cancel" @click="cancelDelete">取消</view>
					<view class="modal-button confirm" @click="handleDeleteConfirm">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserPhotos } from '@/api/medical'
import { getIllnessAnalysis } from '@/api/ai'
import { getBaseUrl } from '@/config'

const historyList = ref([])
const loading = ref(true)

// 删除确认弹窗状态
const showModal = ref(false)
const deleteModalTitle = ref('清空历史记录')
const deleteModalContent = ref('确定要清空所有检测历史记录吗？此操作不可恢复')
const currentDeleteItem = ref(null)

onMounted(async () => {
	await fetchHistory()
})

// 获取历史记录
const fetchHistory = async () => {
	loading.value = true
	try {
		// 从本地存储获取历史记录
		const historyStr = uni.getStorageSync('medical_history') || '[]'
		let history = []

		try {
			history = JSON.parse(historyStr)
			if (!Array.isArray(history)) {
				history = []
			}
			// 按时间倒序排列
			history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
		} catch (e) {
			console.error('解析历史记录失败:', e)
			history = []
		}

		historyList.value = history
	} catch (error) {
		historyList.value = []
		console.error('获取检测历史失败:', error)
		uni.showToast({
			title: '获取历史记录失败',
			icon: 'none'
		})
	} finally {
		loading.value = false
	}
}

// 添加保存历史记录的方法
const saveToHistory = (record) => {
	try {
		// 获取现有历史记录
		const historyStr = uni.getStorageSync('medical_history') || '[]'
		let history = []

		try {
			history = JSON.parse(historyStr)
			if (!Array.isArray(history)) {
				history = []
			}
		} catch (e) {
			console.error('解析历史记录失败:', e)
			history = []
		}

		// 构建记录对象，确保包含所有必要字段
		const newRecord = {
			id: record.id || Date.now().toString(),
			timestamp: record.timestamp || new Date().toISOString(),
			image: record.image || '',
			disease_name: record.disease_name || '',
			confidence: record.confidence || 0,
			analysis: record.analysis || '',
			disclaimer: record.disclaimer || '',
			created_at: record.created_at || new Date().toLocaleString()
		}

		// 检查是否已存在相同记录
		const existingIndex = history.findIndex(item => item.id === newRecord.id)
		if (existingIndex !== -1) {
			// 如果存在相同记录，更新它
			history[existingIndex] = newRecord
		} else {
			// 添加新记录到开头
			history.unshift(newRecord)
		}

		// 最多保存20条记录
		if (history.length > 20) {
			history = history.slice(0, 20)
		}

		// 保存回本地存储
		uni.setStorageSync('medical_history', JSON.stringify(history))
		console.log('保存历史记录成功:', newRecord)

		// 刷新列表
		fetchHistory()
	} catch (e) {
		console.error('保存历史记录失败:', e)
	}
}

// 格式化日期
const formatDate = (dateString) => {
	if (!dateString) return '未知时间'

	const date = new Date(dateString)
	if (isNaN(date.getTime())) return dateString

	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 查看详情
const viewDetail = (item) => {
	// 处理数据格式，确保与API返回格式兼容
	const processedItem = { ...item };

	// 确保disease_name字段存在
	if (item.disease && !item.disease_name) {
		processedItem.disease_name = item.disease;
	}

	// 确保confidence格式正确（0-1之间的小数）
	if (item.confidence && item.confidence > 1) {
		processedItem.confidence = item.confidence / 100;
	}

	// 确保image字段存在
	if (item.image_url && !item.image) {
		processedItem.image = item.image_url;
	}

	// 处理分析文本中的换行符，确保Markdown格式正确
	if (processedItem.analysis) {
		// 将特殊换行符替换为标准换行符
		processedItem.analysis = processedItem.analysis
			.replace(/\\n/g, '\n')
			.replace(/↵/g, '\n');
	}

	console.log('处理后的历史记录项:', processedItem);

	// 检查是否已有详细分析结果
	if (processedItem.analysis) {
		// 如果已有详细分析结果，直接跳转到详情页面
		const analysisResultParam = encodeURIComponent(JSON.stringify(processedItem));
		uni.navigateTo({
			url: `/pages/patient/medical-record-detail?analysisResult=${analysisResultParam}`,
			fail: (error) => {
				console.error('跳转失败:', error)
				uni.showToast({
					title: '页面跳转失败',
					icon: 'none'
				})
			}
		});
	} else {
		// 如果没有详细分析结果，直接获取分析结果
		viewAnalysis(processedItem);
	}
}

// 查看详细分析
const viewAnalysis = async (item) => {
	try {
		uni.showLoading({
			title: '获取分析结果...',
			mask: true
		});

		// 确保有疾病名称
		const diseaseName = item.disease_name || '未知疾病';

		// 调用API获取详细分析结果
		const response = await getIllnessAnalysis(diseaseName);

		uni.hideLoading();

		// 更新分析结果
		if (response && response.data) {
			console.log('API返回详细分析结果:', response.data);

			currentAnalysis.value = response.data || {};
			showAnalysisModal.value = true;
		} else {
			uni.showToast({
				title: '获取分析结果失败',
				icon: 'none'
			});
		}
	} catch (error) {
		uni.hideLoading();
		console.error('获取分析结果失败:', error);
		uni.showToast({
			title: error.message || '获取分析结果失败',
			icon: 'none'
		});
	}
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

// 显示删除全部确认弹窗
const showDeleteConfirm = () => {
	deleteModalTitle.value = '清空历史记录'
	deleteModalContent.value = '确定要清空所有检测历史记录吗？此操作不可恢复'
	currentDeleteItem.value = null
	showModal.value = true
}

// 显示删除单条记录确认弹窗
const showDeleteItemConfirm = (item) => {
	deleteModalTitle.value = '删除记录'
	deleteModalContent.value = `确定要删除"${item.disease_name || '未知疾病'}"的检测记录吗？`
	currentDeleteItem.value = item
	showModal.value = true
}

// 处理删除确认
const handleDeleteConfirm = () => {
	if (currentDeleteItem.value) {
		// 删除单条记录
		deleteHistoryItem(currentDeleteItem.value)
	} else {
		// 清空所有记录
		clearHistory()
	}
}

// 取消删除
const cancelDelete = () => {
	showModal.value = false
	currentDeleteItem.value = null
}

// 删除单条历史记录
const deleteHistoryItem = (item) => {
	try {
		// 获取现有历史记录
		const historyStr = uni.getStorageSync('medical_history') || '[]'
		let history = []

		try {
			history = JSON.parse(historyStr)
			if (!Array.isArray(history)) {
				history = []
			}
		} catch (e) {
			console.error('解析历史记录失败:', e)
			history = []
		}

		// 找到要删除的记录索引
		const deleteIndex = history.findIndex(record => record.id === item.id)

		if (deleteIndex !== -1) {
			// 从数组中删除该记录
			history.splice(deleteIndex, 1)

			// 保存回本地存储
			uni.setStorageSync('medical_history', JSON.stringify(history))

			// 更新当前列表
			historyList.value = history

			// 显示成功提示
			uni.showToast({
				title: '记录已删除',
				icon: 'success',
				duration: 2000
			})
		}
	} catch (e) {
		console.error('删除记录失败:', e)
		uni.showToast({
			title: '删除失败',
			icon: 'none'
		})
	} finally {
		showModal.value = false
		currentDeleteItem.value = null
	}
}

// 清空历史记录
const clearHistory = () => {
	try {
		// 清空本地存储中的历史记录
		uni.setStorageSync('medical_history', '[]')

		// 清空当前列表
		historyList.value = []

		// 显示成功提示
		uni.showToast({
			title: '历史记录已清空',
			icon: 'success',
			duration: 2000
		})
	} catch (e) {
		console.error('清空历史记录失败:', e)
		uni.showToast({
			title: '操作失败',
			icon: 'none'
		})
	} finally {
		showModal.value = false
		currentDeleteItem.value = null
	}
}
</script>

<style lang="scss" scoped>
.detection-history {
	min-height: 100vh;
	background-color: #F5F6FA;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 32rpx;
	background: #FFFFFF;
	position: relative;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	width: 100%;

	.back-btn,
	.delete-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.delete-btn {
		&:active {
			opacity: 0.7;
		}
	}

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.placeholder {
		width: 60rpx;
	}
}

.history-list {
	height: calc(100vh - 180rpx);
	padding: 32rpx;
	width: 100%;
	max-width: 750rpx;
	box-sizing: border-box;

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;

		text {
			margin-top: 20rpx;
			font-size: 32rpx;
			color: #666666;
			font-weight: 500;
		}

		.empty-tip {
			margin-top: 16rpx;
			font-size: 28rpx;
			color: #999999;
		}

		.loading-spinner {
			width: 36px;
			height: 36px;
			border: 3px solid #f3f3f3;
			border-top: 3px solid #5B8CFF;
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}

			100% {
				transform: rotate(360deg);
			}
		}
	}

	.list-content {
		.list-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			padding: 0 10rpx;

			.record-count {
				font-size: 26rpx;
				color: #999999;
			}

			.clear-all {
				display: flex;
				align-items: center;
				padding: 8rpx 16rpx;
				background: rgba(255, 82, 82, 0.1);
				border-radius: 30rpx;
				transition: all 0.2s;

				text {
					font-size: 24rpx;
					color: #FF5252;
					margin-left: 6rpx;
				}

				&:active {
					transform: scale(0.95);
					background: rgba(255, 82, 82, 0.2);
				}
			}
		}

		.history-item {
			background: #FFFFFF;
			border-radius: 24rpx;
			padding: 30rpx;
			margin-bottom: 30rpx;
			display: flex;
			align-items: flex-start;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
			transition: all 0.2s ease;

			&:active {
				transform: scale(0.98);
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
			}

			.item-image {
				width: 160rpx;
				height: 160rpx;
				border-radius: 16rpx;
				margin-right: 24rpx;
				background: #f5f5f5;
				object-fit: cover;
			}

			.item-info {
				flex: 1;
				overflow: hidden;

				.item-main {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 16rpx;

					.item-disease {
						font-size: 32rpx;
						font-weight: 600;
						color: #333333;
					}

					.item-confidence {
						font-size: 24rpx;
						color: #5B8CFF;
						background: rgba(91, 140, 255, 0.1);
						padding: 4rpx 12rpx;
						border-radius: 20rpx;
						white-space: nowrap;
					}
				}

				.item-analysis {
					margin: 12rpx 0;

					.analysis-preview {
						font-size: 26rpx;
						color: #666666;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						overflow: hidden;
						text-overflow: ellipsis;
						line-height: 1.4;
					}
				}

				.item-time {
					font-size: 24rpx;
					color: #999999;
					margin-top: 8rpx;
				}
			}

			.arrow-icon {
				padding: 10rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-left: 10rpx;
			}

			// 添加长按提示效果
			&.long-press {
				background: #f8f8f8;
			}

			// 添加长按提示
			&::after {
				content: '长按可删除';
				position: absolute;
				bottom: 10rpx;
				right: 10rpx;
				font-size: 20rpx;
				color: #999;
				opacity: 0;
				transition: opacity 0.3s;
			}

			&:active::after {
				opacity: 1;
			}
		}
	}
}

// 添加删除按钮的动画效果
.delete-btn {
	position: relative;
	overflow: hidden;

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		background: rgba(255, 82, 82, 0.2);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		transition: width 0.3s, height 0.3s;
	}

	&:active::after {
		width: 60rpx;
		height: 60rpx;
	}
}

// 自定义弹窗样式
.custom-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.modal-content {
		width: 80%;
		background-color: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		padding: 40rpx 30rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

		.modal-title {
			font-size: 36rpx;
			font-weight: 600;
			color: #333;
			text-align: center;
			margin-bottom: 30rpx;
		}

		.modal-text {
			font-size: 30rpx;
			color: #666;
			text-align: center;
			margin-bottom: 40rpx;
			padding: 0 20rpx;
			line-height: 1.5;
		}

		.modal-buttons {
			display: flex;
			border-top: 1px solid #eee;
			margin: 0 -30rpx -40rpx;

			.modal-button {
				flex: 1;
				height: 100rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32rpx;

				&.cancel {
					color: #666;
					border-right: 1px solid #eee;
				}

				&.confirm {
					color: #FF5252;
					font-weight: 500;
				}

				&:active {
					background-color: #f5f5f5;
				}
			}
		}
	}
}
</style>