<template>
	<view class="medical-record-detail-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">病历单详情</text>
			<view class="right"></view>
		</view>

		<!-- 详情内容 -->
		<scroll-view scroll-y class="detail-content" refresher-enabled @refresherrefresh="refreshDetail"
			:refresher-triggered="isRefreshing">
			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading-state">
				<u-loading-icon></u-loading-icon>
				<text>加载中...</text>
			</view>

			<!-- 详情内容 -->
			<view v-else>
				<!-- 状态卡片 -->
				<view class="status-card">
					<text class="status-text" :class="record.drug_recommendation ? 'completed' : 'pending'">
						{{ record.drug_recommendation ? '已完成' : '待处理' }}
					</text>
					<text class="record-id">病历ID：{{ record.id }}</text>
				</view>

				<!-- 患者信息 -->
				<view class="info-card">
					<view class="card-title">患者信息</view>
					<view class="info-item">
						<text class="label">姓名</text>
						<text class="value">{{ record.name }}</text>
					</view>
					<view class="info-item">
						<text class="label">性别</text>
						<text class="value">{{ record.gender }}</text>
					</view>
					<view class="info-item">
						<text class="label">年龄</text>
						<text class="value">{{ record.age }}岁</text>
					</view>
					<view class="info-item">
						<text class="label">联系电话</text>
						<text class="value">{{ formatPhone(record.phone_number) }}</text>
					</view>
				</view>

				<!-- 症状描述 -->
				<view class="info-card">
					<view class="card-title">症状描述</view>
					<view class="description-content">
						{{ record.symptoms_description }}
					</view>
				</view>

				<!-- 详细描述 -->
				<view class="info-card" v-if="record.detailed_description">
					<view class="card-title">详细描述</view>
					<view class="description-content">
						{{ record.detailed_description }}
					</view>
				</view>

				<!-- 病情分析 -->
				<view class="info-card" v-if="record.condition_analysis">
					<view class="card-title">病情分析</view>
					<view class="description-content">
						{{ record.condition_analysis }}
					</view>
				</view>

				<!-- 用药建议 -->
				<view class="info-card" v-if="record.drug_recommendation">
					<view class="card-title">用药建议</view>
					<view class="description-content">
						{{ record.drug_recommendation }}
					</view>
				</view>

				<!-- 时间信息 -->
				<view class="info-card">
					<view class="card-title">时间信息</view>
					<view class="info-item">
						<text class="label">创建时间</text>
						<text class="value">{{ formatDateTime(record.created_at) }}</text>
					</view>
					<view class="info-item">
						<text class="label">更新时间</text>
						<text class="value">{{ formatDateTime(record.updated_at) }}</text>
					</view>
				</view>

				<!-- 操作按钮 -->
				<view class="action-buttons" v-if="!record.drug_recommendation">
					<button class="action-btn treatment" @click="startTreatment">开始诊疗</button>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMedicalRecordsList } from '@/api/doctor'

const props = defineProps({
	id: {
		type: String,
		required: true
	}
})

const record = ref({})
const isLoading = ref(false)
const isRefreshing = ref(false)

// 格式化手机号
const formatPhone = (phone) => {
	if (!phone) return ''
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
	if (!dateTimeStr) return ''
	const date = new Date(dateTimeStr)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取病历单详情
const fetchRecordDetail = async () => {
	isLoading.value = true
	try {
		// 获取病历列表
		const response = await getMedicalRecordsList()
		if (response && Array.isArray(response)) {
			// 从列表中筛选出当前ID的病历
			const foundRecord = response.find(item => item.id.toString() === props.id)
			if (foundRecord) {
				record.value = foundRecord
			} else {
				throw new Error('未找到对应的病历记录')
			}
		} else {
			throw new Error('获取病历列表失败：无效的响应格式')
		}
	} catch (error) {
		console.error('获取病历单详情失败:', error)
		uni.showToast({
			title: error.message || '获取病历单详情失败',
			icon: 'none'
		})
	} finally {
		isLoading.value = false
		isRefreshing.value = false
	}
}

// 刷新详情
const refreshDetail = async () => {
	isRefreshing.value = true
	await fetchRecordDetail()
}

// 开始诊疗
const startTreatment = () => {
	// 跳转到工作台页面
	uni.navigateTo({
		url: '/pages/doctor/workbench',
		success: () => {
			// 通知工作台页面开始诊疗
			uni.$emit('treatmentAppointment')
		},
		fail: (error) => {
			console.error('跳转失败:', error)
			uni.showToast({
				title: '页面跳转失败',
				icon: 'none'
			})
		}
	})
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

onMounted(() => {
	fetchRecordDetail()
})
</script>

<style lang="scss" scoped>
.medical-record-detail-container {
	min-height: 100vh;
	background: #F5F6FA;
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFFFF;

	.left,
	.right {
		width: 80rpx;
		display: flex;
		align-items: center;
	}

	.left {
		justify-content: flex-start;
	}

	.right {
		justify-content: flex-end;
	}

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
	}
}

.detail-content {
	padding: 20rpx 32rpx;
	box-sizing: border-box;
	height: calc(100vh - 180rpx);
}

.status-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.status-text {
		font-size: 40rpx;
		font-weight: 500;
		margin-bottom: 16rpx;

		&.completed {
			color: #4CD964;
		}

		&.pending {
			color: #FF9500;
		}
	}

	.record-id {
		font-size: 28rpx;
		color: #666666;
	}
}

.info-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.card-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333333;
		margin-bottom: 24rpx;
		padding-bottom: 16rpx;
		border-bottom: 1px solid #EEEEEE;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.label {
			font-size: 28rpx;
			color: #666666;
		}

		.value {
			font-size: 28rpx;
			color: #333333;
		}
	}

	.description-content {
		font-size: 28rpx;
		color: #333333;
		line-height: 1.6;
		white-space: pre-wrap;
	}
}

.action-buttons {
	display: flex;
	gap: 20rpx;
	margin-top: 40rpx;
	padding: 0 32rpx 40rpx;

	.action-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 500;
		margin: 0 16rpx;
		border: none;

		&::after {
			border: none;
		}

		&.treatment {
			color: #FFFFFF;
			background: #4CD964;
		}
	}
}

.loading-state {
	padding: 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;

	text {
		font-size: 28rpx;
		color: #999999;
	}
}
</style>