<template>
	<view class="patient-home">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<text class="title">首页</text>
			<view class="header-right">
				<u-icon name="more-dot-fill" color="#000000" size="20"></u-icon>
				<u-icon name="camera-fill" color="#000000" size="20" style="margin-left: 16rpx;"></u-icon>
			</view>
		</view>

		<!-- AI测肤区域 -->
		<view class="ai-section">
			<view class="section-header">
				<text class="section-title">AI皮肤病检测</text>
				<text class="view-all" @click="navigateToHistory">历史记录</text>
			</view>
			<view class="ai-description">
				<text>上传照片，AI快速分析皮肤问题</text>
			</view>
			<view class="function-cards">
				<view class="function-card" @click="handleTakePhoto">
					<view class="card-icon">
						<u-icon name="camera-fill" size="48" color="#4A90E2"></u-icon>
					</view>
					<view class="card-text">
						<text class="card-title">拍照检测</text>
						<text class="card-desc">立即拍照分析</text>
					</view>
				</view>
				<view class="function-card" @click="handleUploadPhoto">
					<view class="card-icon">
						<u-icon name="photo" size="48" color="#4A90E2"></u-icon>
					</view>
					<view class="card-text">
						<text class="card-title">照片检测</text>
						<text class="card-desc">上传照片分析</text>
					</view>
				</view>
			</view>
			<view class="ai-tips">
				<u-icon name="info-circle" size="24" color="#999999"></u-icon>
				<text>支持JPG/PNG格式图片</text>
			</view>
		</view>

		<!-- 预约区域 -->
		<view class="appointment-section">
			<view class="section-header">
				<text class="section-title">预约</text>
				<text class="view-all" @click="navigateToAppointments">查看全部</text>
			</view>
			<view class="appointment-cards">
				<view v-if="appointments.length === 0" class="empty-state">
					<text>暂无预约</text>
				</view>
				<view v-else class="appointment-list">
					<view v-for="appointment in appointments.slice(0, 2)" :key="appointment.id" class="appointment-card"
						@click="viewAppointmentDetail(appointment.id)">
						<view class="appointment-info">
							<view class="doctor-info">
								<text class="doctor-name">主治医生</text>
								<text class="appointment-time">{{ appointment.appointment_time }}</text>
							</view>
							<text :class="['appointment-status', getStatusClass(appointment.status)]">
								{{ getStatusText(appointment.status) }}
							</text>
						</view>
						<view class="appointment-number">
							<text class="label">预约号：</text>
							<text class="value">{{ appointment.appointment_number }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 添加自定义 tabBar -->
		<custom-tab-bar></custom-tab-bar>
	</view>
</template>

<script setup>
import CustomTabBar from '@/components/custom-tab-bar.vue'
import { useTabBarStore } from '@/store/tabBar'
import { onMounted, ref, onActivated, onUnmounted } from 'vue'
import { uploadPhotoAndGetFullDiagnosis, getUserPhotos } from '@/api/medical'
import { getAppointmentList } from '@/api/appointment'
import { getBaseUrl } from '@/config'

const store = useTabBarStore()
const appointments = ref([])
const detectionHistory = ref([])

// 获取预约列表
const fetchAppointments = async () => {
	try {
		const response = await getAppointmentList()
		if (response && response.code === 200) {
			appointments.value = Array.isArray(response.data) ? response.data : []
			console.log('首页预约列表已更新:', appointments.value)
		} else {
			appointments.value = []
		}
	} catch (error) {
		console.error('获取预约列表失败:', error)
		appointments.value = []
	}
}

// 页面显示时刷新数据
const onShow = () => {
	console.log('首页显示，刷新预约列表')
	fetchAppointments()
}

onMounted(async () => {
	store.setCurrentPath('/pages/patient/index')
	await fetchAppointments()
})

// 监听页面显示
uni.$on('updateAppointments', () => {
	console.log('收到更新预约列表事件')
	fetchAppointments()
})

// 组件销毁时清理事件监听
onUnmounted(() => {
	uni.$off('updateAppointments')
})

// 获取检测历史记录
const fetchDetectionHistory = async () => {
	try {
		const response = await getUserPhotos()
		if (response && Array.isArray(response)) {
			detectionHistory.value = response
		} else {
			detectionHistory.value = []
			console.error('检测历史数据格式错误:', response)
		}
	} catch (error) {
		detectionHistory.value = []
		console.error('获取检测历史失败:', error)
	}
}

// 获取状态文本
const getStatusText = (status) => {
	if (!status) return '待就诊'
	return status
}

// 获取状态样式类
const getStatusClass = (status) => {
	if (!status) return 'pending'
	switch (status) {
		case '已完成':
			return 'completed'
		case '已取消':
			return 'cancelled'
		default:
			return 'pending'
	}
}

// 查看预约详情
const viewAppointmentDetail = (appointmentId) => {
	uni.navigateTo({
		url: `/pages/patient/appointment-detail?id=${appointmentId}`
	})
}

// 跳转到预约列表页面
const navigateToAppointments = () => {
	uni.navigateTo({
		url: '/pages/patient/my-appointments'
	})
}

// 跳转到历史记录页面
const navigateToHistory = () => {
	uni.navigateTo({
		url: '/pages/patient/detection-history'
	})
}

// 拍照功能
const handleTakePhoto = () => {
	uni.chooseImage({
		count: 1,
		sourceType: ['camera'],
		success: async (res) => {
			try {
				// 使用新的全面诊断API（加载提示已在API函数内部处理）
				const diagnosisResult = await uploadPhotoAndGetFullDiagnosis(res.tempFilePaths[0]);

				console.log('诊断结果:', diagnosisResult);

				// 将诊断结果转换为URL参数
				const resultParam = encodeURIComponent(JSON.stringify(diagnosisResult));

				// 直接跳转到病历详情页面
				uni.navigateTo({
					url: `/pages/patient/medical-record-detail?analysisResult=${resultParam}`,
					fail: (error) => {
						console.error('跳转失败:', error);
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						});
					}
				});
			} catch (error) {
				console.error('诊断失败:', error);
				uni.showToast({
					title: error.message || '诊断失败，请重试',
					icon: 'none',
					duration: 2000
				});
			}
		},
		fail: (error) => {
			console.error('拍照失败:', error);
			uni.showToast({
				title: '拍照失败，请重试',
				icon: 'none'
			});
		}
	})
}

// 上传照片
const handleUploadPhoto = () => {
	uni.chooseImage({
		count: 1,
		sourceType: ['album'],
		success: async (res) => {
			try {
				// 检查文件类型
				const filePath = res.tempFilePaths[0];
				const fileExtension = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();

				if (fileExtension !== 'jpg' && fileExtension !== 'jpeg' && fileExtension !== 'png') {
					throw new Error('只支持JPG/PNG格式的图片');
				}

				// 使用新的全面诊断API（加载提示已在API函数内部处理）
				const diagnosisResult = await uploadPhotoAndGetFullDiagnosis(filePath);

				console.log('诊断结果:', diagnosisResult);

				// 将诊断结果转换为URL参数
				const resultParam = encodeURIComponent(JSON.stringify(diagnosisResult));

				// 直接跳转到病历详情页面
				uni.navigateTo({
					url: `/pages/patient/medical-record-detail?analysisResult=${resultParam}`,
					fail: (error) => {
						console.error('跳转失败:', error);
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						});
					}
				});
			} catch (error) {
				console.error('诊断失败:', error);
				uni.showToast({
					title: error.message || '诊断失败，请重试',
					icon: 'none',
					duration: 2000
				});
			}
		},
		fail: (error) => {
			console.error('选择照片失败:', error);
			uni.showToast({
				title: '选择照片失败，请重试',
				icon: 'none'
			});
		}
	})
}
</script>

<style lang="scss" scoped>
.patient-home {
	min-height: 100vh;
	background: rgba(239, 243, 248, 1);
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

	.header-right {
		display: flex;
		align-items: center;
		gap: 32rpx;
	}
}

.ai-section {
	margin: 32rpx;
	padding: 32rpx;
	background: #FFFFFF;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;

		.section-title {
			font-size: 32rpx;
			font-weight: 500;
			color: #333333;
		}

		.view-all {
			font-size: 28rpx;
			color: #4A90E2;
		}
	}

	.ai-description {
		font-size: 26rpx;
		color: #666666;
		margin-bottom: 32rpx;
	}
}

.function-cards {
	display: flex;
	gap: 32rpx;

	.function-card {
		flex: 1;
		height: 180rpx;
		background: #F8F9FA;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		padding: 24rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;

		&:active {
			transform: scale(0.98);
			background: #F0F2F5;
		}

		.card-icon {
			margin-right: 24rpx;
		}

		.card-text {
			display: flex;
			flex-direction: column;

			.card-title {
				font-size: 28rpx;
				font-weight: 500;
				color: #333333;
				margin-bottom: 8rpx;
			}

			.card-desc {
				font-size: 24rpx;
				color: #999999;
			}
		}
	}
}

.ai-tips {
	display: flex;
	align-items: center;
	margin-top: 24rpx;
	padding: 16rpx;
	background: #F8F9FA;
	border-radius: 8rpx;

	text {
		font-size: 24rpx;
		color: #999999;
		margin-left: 8rpx;
	}
}

.appointment-section {
	margin: 32rpx;
	padding: 32rpx;
	background: #FFFFFF;
	border-radius: 16rpx;

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;

		.section-title {
			font-size: 32rpx;
			font-weight: 500;
			color: #333333;
		}

		.view-all {
			font-size: 28rpx;
			color: #4A90E2;
		}
	}

	.empty-state {
		text-align: center;
		padding: 40rpx 0;
		color: #999999;
		font-size: 28rpx;
	}

	.appointment-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.appointment-card {
		background: #F8F9FA;
		border-radius: 12rpx;
		padding: 24rpx;

		.appointment-info {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 16rpx;

			.doctor-info {
				.doctor-name {
					font-size: 32rpx;
					font-weight: 500;
					color: #333333;
					margin-bottom: 8rpx;
					display: block;
				}

				.appointment-time {
					font-size: 24rpx;
					color: #666666;
				}
			}

			.appointment-status {
				font-size: 24rpx;
				padding: 4rpx 12rpx;
				border-radius: 4rpx;

				&.pending {
					color: #FF9500;
					background: rgba(255, 149, 0, 0.1);
				}

				&.completed {
					color: #4CD964;
					background: rgba(76, 217, 100, 0.1);
				}

				&.cancelled {
					color: #FF3B30;
					background: rgba(255, 59, 48, 0.1);
				}
			}
		}

		.appointment-number {
			font-size: 24rpx;
			color: #999999;

			.label {
				margin-right: 8rpx;
			}
		}
	}
}
</style>