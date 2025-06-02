<template>
	<view class="medical-forms-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">病历单列表</text>
			<view class="right"></view>
		</view>

		<!-- 病历单列表 -->
		<scroll-view scroll-y class="forms-list" refresher-enabled @refresherrefresh="refreshForms"
			:refresher-triggered="isRefreshing">
			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading-state">
				<u-loading-icon></u-loading-icon>
				<text>加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="medicalForms.length === 0" class="empty-state">
				<u-empty mode="data" text="暂无病历单"></u-empty>
			</view>

			<!-- 病历单列表 -->
			<view v-else class="form-item" v-for="(form, index) in medicalForms" :key="index"
				@click="viewFormDetail(form.id)">
				<view class="form-header">
					<view class="date-info">
						<text class="date">{{ formatDate(form.created_at) }}</text>
						<text class="time">{{ formatTime(form.created_at) }}</text>
					</view>
					<text :class="['status', form.cure_suggestion ? 'completed' : 'pending']">
						{{ form.cure_suggestion ? '已完成' : '待处理' }}
					</text>
				</view>

				<view class="form-content">
					<view class="doctor-info">
						<text class="label">主治医生：</text>
						<text class="value">{{ form.doctor_name }}</text>
					</view>
					<view class="suggestion-info" v-if="form.cure_suggestion">
						<text class="label">诊疗建议：</text>
						<text class="value">{{ form.cure_suggestion }}</text>
					</view>
				</view>

				<view class="form-footer">
					<text class="created-at">创建时间：{{ formatDateTime(form.created_at) }}</text>
					<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMedicalFormsList } from '@/api/patient'

const medicalForms = ref([])
const isLoading = ref(false)
const isRefreshing = ref(false)

// 格式化日期
const formatDate = (dateTimeStr) => {
	if (!dateTimeStr) return ''
	const date = new Date(dateTimeStr)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 格式化时间
const formatTime = (dateTimeStr) => {
	if (!dateTimeStr) return ''
	const date = new Date(dateTimeStr)
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
	if (!dateTimeStr) return ''
	return `${formatDate(dateTimeStr)} ${formatTime(dateTimeStr)}`
}

// 获取病历单列表
const fetchMedicalForms = async () => {
	isLoading.value = true
	try {
		const response = await getMedicalFormsList()
		if (response && Array.isArray(response)) {
			medicalForms.value = response
		} else {
			medicalForms.value = []
			console.error('病历单列表数据格式错误:', response)
		}
	} catch (error) {
		console.error('获取病历单列表失败:', error)
		uni.showToast({
			title: '获取病历单列表失败',
			icon: 'none'
		})
		medicalForms.value = []
	} finally {
		isLoading.value = false
		isRefreshing.value = false
	}
}

// 刷新病历单列表
const refreshForms = async () => {
	isRefreshing.value = true
	await fetchMedicalForms()
}

// 查看病历单详情
const viewFormDetail = (formId) => {
	uni.navigateTo({
		url: `/pages/patient/medical-form-detail?id=${formId}`,
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
	fetchMedicalForms()
})
</script>

<style lang="scss" scoped>
.medical-forms-container {
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
		width: 60rpx;
	}

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
	}
}

.forms-list {
	padding: 32rpx;
	height: calc(100vh - 180rpx);
}

.form-item {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;

		.date-info {
			.date {
				font-size: 32rpx;
				color: #333333;
				font-weight: 500;
				margin-right: 16rpx;
			}

			.time {
				font-size: 28rpx;
				color: #666666;
			}
		}

		.status {
			font-size: 28rpx;
			padding: 4rpx 16rpx;
			border-radius: 24rpx;

			&.completed {
				color: #4CD964;
				background: rgba(76, 217, 100, 0.1);
			}

			&.pending {
				color: #FF9500;
				background: rgba(255, 149, 0, 0.1);
			}
		}
	}

	.form-content {
		margin-bottom: 24rpx;

		.doctor-info,
		.suggestion-info {
			display: flex;
			margin-bottom: 16rpx;

			.label {
				font-size: 28rpx;
				color: #666666;
				width: 160rpx;
			}

			.value {
				font-size: 28rpx;
				color: #333333;
				flex: 1;
			}
		}
	}

	.form-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;

		.created-at {
			font-size: 24rpx;
			color: #999999;
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

.empty-state {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>