<template>
	<view class="patient-list-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">我的患者</text>
			<view class="right"></view>
		</view>

		<!-- 患者列表 -->
		<scroll-view scroll-y class="patient-list" v-if="patients.length > 0">
			<view class="patient-item" v-for="patient in patients" :key="patient.id">
				<image class="avatar" :src="patient.avatar || '/static/images/default-avatar.png'" mode="aspectFill">
				</image>
				<view class="info">
					<view class="top-row">
						<view class="name-box">
							<text class="name">{{ patient.name }}</text>
							<text class="gender-age">{{ patient.gender === 'male' ? '男' : '女' }} {{ patient.age
								}}岁</text>
						</view>
						<text class="phone">{{ formatPhone(patient.phone) }}</text>
					</view>
					<view class="bottom-row">
						<text class="visit-count">就诊 {{ patient.visitCount }} 次</text>
						<text class="last-visit">上次就诊: {{ patient.lastVisitTime }}</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<u-empty mode="data" text="暂无患者"></u-empty>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPatientList } from '@/api/patient'

const patients = ref([])

// 格式化手机号，中间4位显示*
const formatPhone = (phone) => {
	if (!phone) return ''
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack({
		fail: () => {
			uni.reLaunch({
				url: '/pages/doctor/profile'
			})
		}
	})
}

// 获取患者列表
const fetchPatients = async () => {
	try {
		// TODO: 后端接口实现后替换为实际API调用
		// const response = await getPatientList()
		// patients.value = response.data
		patients.value = [{
			id: 1,
			name: '张三',
			gender: 'male',
			age: 28,
			phone: '13812345678',
			avatar: '',
			visitCount: 3,
			lastVisitTime: '2024-03-15'
		}, {
			id: 2,
			name: '李四',
			gender: 'female',
			age: 35,
			phone: '13987654321',
			avatar: '',
			visitCount: 1,
			lastVisitTime: '2024-03-10'
		}]
	} catch (error) {
		console.error('获取患者列表失败:', error)
		uni.showToast({
			title: '获取患者列表失败',
			icon: 'none'
		})
	}
}

onMounted(() => {
	fetchPatients()
})
</script>

<style lang="scss" scoped>
.patient-list-container {
	min-height: 100vh;
	background: #F5F6FA;
	padding-bottom: env(safe-area-inset-bottom);
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFFFF;
	box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);

	.left {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
	}

	.right {
		width: 60rpx;
		height: 60rpx;
	}
}

.patient-list {
	height: calc(100vh - 180rpx);
	padding: 20rpx 32rpx;
	box-sizing: border-box;
}

.patient-item {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 24rpx;
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;

	.avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50rpx;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.info {
		flex: 1;
		min-width: 0;

		.top-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 12rpx;

			.name-box {
				display: flex;
				align-items: center;
				gap: 12rpx;

				.name {
					font-size: 32rpx;
					font-weight: 500;
					color: #333333;
				}

				.gender-age {
					font-size: 24rpx;
					color: #666666;
					background: #F5F6FA;
					padding: 4rpx 12rpx;
					border-radius: 4rpx;
				}
			}

			.phone {
				font-size: 28rpx;
				color: #999999;
			}
		}

		.bottom-row {
			display: flex;
			align-items: center;
			gap: 24rpx;

			.visit-count,
			.last-visit {
				font-size: 24rpx;
				color: #666666;
			}
		}
	}
}

.empty-state {
	height: calc(100vh - 180rpx);
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
