<template>
	<view class="appointments-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<text class="title">预约管理</text>
		</view>

		<!-- 预约列表 -->
		<scroll-view scroll-y class="appointments-list" refresher-enabled @refresherrefresh="refreshAppointments"
			:refresher-triggered="isRefreshing">
			<view class="appointment-card" v-for="(appointment, index) in appointments" :key="index"
				@click="viewAppointmentDetail(appointment.id)">
				<view class="card-header">
					<view class="patient-info">
						<text class="name">{{ appointment.patient_name }}</text>
						<text class="phone">{{ formatPhone(appointment.patient_phone_number) }}</text>
					</view>
					<text :class="['status', getStatusClass(appointment.status)]">{{ appointment.status }}</text>
				</view>

				<view class="appointment-info">
					<view class="info-item">
						<text class="label">预约时间：</text>
						<text class="value">{{ appointment.appointment_time }}</text>
					</view>
					<view class="info-item">
						<text class="label">预约号：</text>
						<text class="value">{{ appointment.appointment_number }}</text>
					</view>
				</view>

				<view class="card-footer">
					<view class="fee-info">
						<text class="fee-label">总费用：</text>
						<text class="fee-value">¥{{ calculateTotalFee(appointment) }}</text>
					</view>
					<view class="actions">
						<button class="action-btn confirm" v-if="appointment.status === '待确认'"
							@click.stop="confirmAppointment(appointment)">确认预约</button>
						<button class="action-btn cancel" v-if="appointment.status === '待确认'"
							@click.stop="cancelAppointment(appointment)">取消预约</button>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-if="appointments.length === 0 && !isRefreshing" class="empty-state">
				<u-empty mode="data" text="暂无预约"></u-empty>
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
import { getAppointmentList, confirmAppointment as confirmAppointmentApi, cancelAppointment as cancelAppointmentApi } from '@/api/doctor'

const store = useTabBarStore()
const appointments = ref([])
const isRefreshing = ref(false)

// 格式化手机号，中间4位显示*
const formatPhone = (phone) => {
	if (!phone) return ''
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 获取状态样式类
const getStatusClass = (status) => {
	const statusMap = {
		'待确认': 'pending',
		'已确认': 'confirmed',
		'已完成': 'completed',
		'已取消': 'cancelled'
	}
	return statusMap[status] || 'pending'
}

// 计算总费用
const calculateTotalFee = (appointment) => {
	const registrationFee = appointment.registration_fee || 50
	const appointmentFee = appointment.appointment_fee || 100
	return registrationFee + appointmentFee
}

// 获取预约列表
const fetchAppointments = async () => {
	try {
		const response = await getAppointmentList()
		if (response && Array.isArray(response)) {
			appointments.value = response
		} else {
			appointments.value = []
			console.error('预约列表数据格式错误:', response)
		}
	} catch (error) {
		console.error('获取预约列表失败:', error)
		uni.showToast({
			title: '获取预约列表失败',
			icon: 'none'
		})
	} finally {
		isRefreshing.value = false
	}
}

// 刷新预约列表
const refreshAppointments = async () => {
	isRefreshing.value = true
	await fetchAppointments()
}

// 查看预约详情
const viewAppointmentDetail = (appointmentId) => {
	uni.navigateTo({
		url: `/pages/doctor/appointment-detail?id=${appointmentId}`,
		fail: (error) => {
			console.error('跳转失败:', error)
			uni.showToast({
				title: '页面跳转失败',
				icon: 'none'
			})
		}
	})
}

// 确认预约
const confirmAppointment = async (appointment) => {
	try {
		uni.showLoading({
			title: '处理中...',
			mask: true
		})

		await confirmAppointmentApi(appointment.doctor_id, appointment.appointment_number)

		uni.hideLoading()
		uni.showToast({
			title: '已确认预约',
			icon: 'success'
		})

		// 刷新预约列表
		await fetchAppointments()
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '操作失败',
			icon: 'none'
		})
	}
}

// 取消预约
const cancelAppointment = async (appointment) => {
	try {
		const result = await uni.showModal({
			title: '取消预约',
			content: '确定要取消这个预约吗？',
			confirmText: '确定',
			cancelText: '取消'
		})

		if (result.confirm) {
			uni.showLoading({
				title: '处理中...',
				mask: true
			})

			await cancelAppointmentApi(appointment.doctor_id, appointment.appointment_number)

			uni.hideLoading()
			uni.showToast({
				title: '已取消预约',
				icon: 'success'
			})

			// 刷新预约列表
			await fetchAppointments()
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '操作失败',
			icon: 'none'
		})
	}
}

onMounted(() => {
	store.setCurrentPath('/pages/doctor/appointments')
	fetchAppointments()

	// 监听页面显示事件，用于从其他页面返回时刷新数据
	uni.$on('refreshAppointments', () => {
		fetchAppointments()
	})
})

// 在组件卸载时移除事件监听
onUnmounted(() => {
	uni.$off('refreshAppointments')
})
</script>

<style lang="scss" scoped>
.appointments-container {
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

.appointments-list {
	padding: 20rpx 32rpx;
	box-sizing: border-box;
	height: calc(100vh - 180rpx);
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

		.patient-info {
			.name {
				font-size: 32rpx;
				font-weight: 500;
				color: #333333;
				margin-right: 16rpx;
			}

			.phone {
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

			&.confirmed {
				color: #4A90E2;
				background: rgba(74, 144, 226, 0.1);
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

	.appointment-info {
		margin-bottom: 24rpx;

		.info-item {
			display: flex;
			margin-bottom: 12rpx;

			&:last-child {
				margin-bottom: 0;
			}

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
			display: flex;
			gap: 16rpx;

			.action-btn {
				font-size: 28rpx;
				padding: 12rpx 24rpx;
				border-radius: 32rpx;
				background: #FFFFFF;
				line-height: 1;

				&.confirm {
					color: #4A90E2;
					border: 1px solid #4A90E2;
				}

				&.cancel {
					color: #FF3B30;
					border: 1px solid #FF3B30;
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
</style>