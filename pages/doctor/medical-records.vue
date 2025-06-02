<template>
	<view class="medical-records-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<text class="title">病历单列表</text>
		</view>

		<!-- 病历列表 -->
		<scroll-view scroll-y class="records-list" refresher-enabled @refresherrefresh="refreshRecords"
			:refresher-triggered="isRefreshing">
			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading-state">
				<u-loading-icon></u-loading-icon>
				<text>加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="medicalRecords.length === 0" class="empty-state">
				<u-empty mode="data" text="暂无病历单"></u-empty>
			</view>

			<!-- 病历列表 -->
			<view v-else class="record-item" v-for="(record, index) in medicalRecords" :key="index"
				@click="viewRecordDetail(record.id)">
				<view class="record-header">
					<view class="date-info">
						<text class="date">{{ formatDate(record.created_at) }}</text>
						<text class="time">{{ formatTime(record.created_at) }}</text>
					</view>
					<text :class="['status', record.drug_recommendation ? 'completed' : 'pending']">
						{{ record.drug_recommendation ? '已完成' : '待处理' }}
					</text>
				</view>

				<view class="record-content">
					<view class="patient-info">
						<text class="label">患者姓名：</text>
						<text class="value">{{ record.name }}</text>
					</view>
					<view class="age-info">
						<text class="label">年龄：</text>
						<text class="value">{{ record.age }}岁</text>
					</view>
					<view class="symptom-info">
						<text class="label">症状：</text>
						<text class="value">{{ record.symptoms_description }}</text>
					</view>
				</view>

				<view class="record-footer">
					<text class="created-at">创建时间：{{ formatDateTime(record.created_at) }}</text>
					<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
				</view>
			</view>
		</scroll-view>

		<!-- 底部导航栏 -->
		<doctor-tab-bar></doctor-tab-bar>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DoctorTabBar from '@/components/doctor-tab-bar.vue'
import { useTabBarStore } from '@/store/tabBar'
import { getMedicalRecordsList } from '@/api/doctor'

const store = useTabBarStore()
const medicalRecords = ref([])
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

// 格式化手机号，中间4位显示*
const formatPhone = (phone) => {
	if (!phone) return ''
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 获取病历单列表
const fetchMedicalRecords = async () => {
	isLoading.value = true
	try {
		const response = await getMedicalRecordsList()
		if (response && Array.isArray(response)) {
			medicalRecords.value = response
		} else {
			medicalRecords.value = []
			console.error('病历单列表数据格式错误:', response)
		}
	} catch (error) {
		console.error('获取病历单列表失败:', error)
		uni.showToast({
			title: '获取病历单列表失败',
			icon: 'none'
		})
		medicalRecords.value = []
	} finally {
		isLoading.value = false
		isRefreshing.value = false
	}
}

// 刷新病历单列表
const refreshRecords = async () => {
	isRefreshing.value = true
	await fetchMedicalRecords()
}

// 查看病历单详情
const viewRecordDetail = (recordId) => {
	uni.navigateTo({
		url: `/pages/doctor/medical-record-detail?id=${recordId}`,
		fail: (error) => {
			console.error('跳转失败:', error)
			uni.showToast({
				title: '页面跳转失败',
				icon: 'none'
			})
		}
	})
}

onMounted(() => {
	store.setCurrentPath('/pages/doctor/medical-records')
	fetchMedicalRecords()
})
</script>

<style lang="scss" scoped>
.medical-records-container {
	min-height: 100vh;
	background: #F5F6FA;
	padding-bottom: 120rpx;
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFFFF;

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
	}
}

.records-list {
	padding: 20rpx 32rpx;
	box-sizing: border-box;
	height: calc(100vh - 180rpx);
}

.record-item {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.record-header {
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

	.record-content {
		margin-bottom: 24rpx;

		.patient-info,
		.age-info,
		.symptom-info {
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

	.record-footer {
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