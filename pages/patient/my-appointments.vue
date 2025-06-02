<template>
	<view class="appointments-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">我的预约</text>
			<view class="right"></view>
		</view>

		<!-- 预约列表 -->
		<scroll-view scroll-y class="appointments-list" refresher-enabled @refresherrefresh="refreshAppointments"
			:refresher-triggered="isRefreshing">
			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading-state">
				<u-loading-icon></u-loading-icon>
				<text>加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="appointments.length === 0" class="empty-state">
				<u-empty mode="data" text="暂无预约"></u-empty>
			</view>

			<!-- 预约列表 -->
			<template v-else>
				<view class="appointment-card" v-for="appointment in appointments" :key="appointment.id"
					@click="viewAppointmentDetail(appointment.id)">
					<view class="card-header">
						<view class="hospital-info">
							<text class="hospital-name">邯郸医院</text>
							<text class="department">皮肤科</text>
						</view>
						<text :class="['status', getStatusClass(appointment.status)]">
							{{ getStatusText(appointment.status) }}
						</text>
					</view>

					<view class="doctor-info">
						<view class="avatar-section">
							<image class="avatar" src="/static/images/default-avatar.png" mode="aspectFill"></image>
						</view>
						<view class="info-content">
							<view class="name-title">
								<text class="name">主治医生</text>
								<text class="title">医师</text>
							</view>
							<view class="appointment-time">
								<u-icon name="calendar" size="14" color="#666666"></u-icon>
								<text class="time">{{ appointment.appointment_time }}</text>
							</view>
						</view>
					</view>

					<view class="card-footer">
						<view class="fee-info">
							<text class="fee-label">预约号：</text>
							<text class="fee-value">{{ appointment.appointment_number }}</text>
						</view>
						<view class="actions">
							<button class="action-btn cancel" v-if="!appointment.patient_visit_time"
								@click.stop="handleCancelAppointment(appointment)">取消预约</button>
						</view>
					</view>
				</view>
			</template>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAppointmentList, cancelAppointment } from '@/api/appointment'

const appointments = ref([])
const isLoading = ref(false)
const isRefreshing = ref(false)

// 获取预约列表
const fetchAppointments = async () => {
	isLoading.value = true
	try {
		const response = await getAppointmentList()
		console.log('预约列表响应:', response) // 添加日志
		if (response && response.code === 200) {
			appointments.value = Array.isArray(response.data) ? response.data : []
			console.log('处理后的预约列表:', appointments.value) // 添加日志
		} else {
			appointments.value = []
		}
	} catch (error) {
		console.error('获取预约列表失败:', error)
		appointments.value = []
		uni.showToast({
			title: '获取预约列表失败',
			icon: 'none'
		})
	} finally {
		isLoading.value = false
		isRefreshing.value = false
	}
}

// 刷新预约列表
const refreshAppointments = async () => {
	isRefreshing.value = true
	await fetchAppointments()
}

// 取消预约
const handleCancelAppointment = async (appointment) => {
	try {
		uni.showLoading({
			title: '取消中...',
			mask: true
		})

		// 确保有正确的参数
		if (!appointment.id || !appointment.appointment_number) {
			throw new Error('预约信息不完整')
		}

		await cancelAppointment(appointment.id, appointment.appointment_number)

		uni.hideLoading()
		uni.showToast({
			title: '取消成功',
			icon: 'success'
		})

		// 刷新预约列表
		await fetchAppointments()

		// 通知首页更新预约列表
		uni.$emit('updateAppointments')

		// 延迟返回首页
		setTimeout(() => {
			handleBack()
		}, 1500)
	} catch (error) {
		console.error('取消预约失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: error.message || '取消失败',
			icon: 'none'
		})
	}
}

// 获取状态文本
const getStatusText = (status) => {
	if (!status) return '待就诊'
	switch (status) {
		case 'pending':
			return '待就诊'
		case 'completed':
			return '已完成'
		case 'cancelled':
			return '已取消'
		default:
			return status
	}
}

// 获取状态样式类
const getStatusClass = (status) => {
	if (!status) return 'pending'
	switch (status) {
		case 'completed':
		case '已完成':
			return 'completed'
		case 'cancelled':
		case '已取消':
			return 'cancelled'
		case 'pending':
		case '待就诊':
		default:
			return 'pending'
	}
}

// 查看预约详情
const viewAppointmentDetail = (appointmentId) => {
	if (!appointmentId) {
		console.error('无效的预约ID')
		return
	}
	uni.navigateTo({
		url: `/pages/patient/appointment-detail?id=${appointmentId}`,
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
	// 通知首页更新预约列表
	uni.$emit('updateAppointments')

	uni.navigateBack({
		fail: () => {
			uni.reLaunch({
				url: '/pages/patient/profile'
			})
		}
	})
}

onMounted(() => {
	console.log('页面加载，开始获取预约列表') // 添加日志
	fetchAppointments()
})
</script>

<style lang="scss" scoped>
.appointments-container {
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

.appointments-list {
	height: calc(100vh - 180rpx);
	padding: 20rpx 32rpx;
	box-sizing: border-box;
}

.appointment-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;

		.hospital-info {
			.hospital-name {
				font-size: 32rpx;
				color: #333333;
				font-weight: 500;
				margin-right: 16rpx;
			}

			.department {
				font-size: 28rpx;
				color: #666666;
			}
		}

		.status {
			font-size: 28rpx;
			padding: 4rpx 16rpx;
			border-radius: 24rpx;

			&.pending {
				color: #FF9500;
				background: rgba(255, 149, 0, 0.1);
			}

			&.completed {
				color: #4CD964;
				background: rgba(76, 217, 100, 0.1);
			}

			&.cancelled {
				color: #999999;
				background: rgba(153, 153, 153, 0.1);
			}
		}
	}

	.doctor-info {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;

		.avatar-section {
			width: 100rpx;
			height: 100rpx;
			border-radius: 50rpx;
			overflow: hidden;
			margin-right: 20rpx;
			background: #F5F5F5;

			.avatar {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.info-content {
			flex: 1;

			.name-title {
				display: flex;
				align-items: center;
				margin-bottom: 8rpx;

				.name {
					font-size: 32rpx;
					color: #333333;
					font-weight: 500;
					margin-right: 16rpx;
				}

				.title {
					font-size: 24rpx;
					color: #666666;
					background: #F5F6FA;
					padding: 4rpx 12rpx;
					border-radius: 4rpx;
				}
			}

			.appointment-time {
				display: flex;
				align-items: center;
				gap: 8rpx;

				.time {
					font-size: 28rpx;
					color: #666666;
				}
			}
		}
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;

		.fee-info {
			.fee-label {
				font-size: 28rpx;
				color: #666666;
			}

			.fee-value {
				font-size: 32rpx;
				color: #333333;
				font-weight: 500;
			}
		}

		.actions {
			.action-btn {
				padding: 12rpx 32rpx;
				border-radius: 32rpx;
				font-size: 28rpx;
				background: none;
				margin: 0;

				&.cancel {
					color: #FF3B30;
					border: 1px solid #FF3B30;
				}

				&::after {
					border: none;
				}
			}
		}
	}
}

.empty-state {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
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