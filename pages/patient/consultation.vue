<template>
	<view class="consultation-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<text class="title">咨询预约</text>
		</view>

		<!-- 搜索栏 -->
		<view class="search-box">
			<u-search v-model="searchKeyword" placeholder="搜索医生姓名/医院/科室" :show-action="false"
				@change="handleSearch"></u-search>
		</view>

		<!-- 医生列表 -->
		<scroll-view scroll-y class="doctor-list" refresher-enabled @refresherrefresh="refreshDoctorList"
			:refresher-triggered="isRefreshing">
			<view class="doctor-card" v-for="(doctor, index) in filteredDoctors" :key="index"
				@click="selectDoctor(doctor)">
				<!-- 左侧头像 -->
				<view class="avatar-section">
					<image class="avatar" :src="doctor.avatar" mode="aspectFill"></image>
				</view>

				<!-- 中间信息 -->
				<view class="info-section">
					<view class="top-row">
						<text class="name">{{ doctor.name }}</text>
						<u-tag :text="doctor.title" type="primary" size="mini" class="tag"></u-tag>
					</view>
					<text class="hospital">{{ doctor.hospital }}</text>
					<text class="description">{{ doctor.introduction }}</text>
					<text class="expertise" v-if="doctor.expertise">擅长：{{ doctor.expertise }}</text>
				</view>

				<!-- 右侧费用信息 -->
				<view class="fee-section">
					<view class="fee-row">
						<text class="label">挂号费：</text>
						<text class="value">¥{{ doctor.registration_fee }}</text>
					</view>
					<view class="fee-row">
						<text class="label">预约费：</text>
						<text class="value">¥{{ doctor.appointment_fee }}</text>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-if="filteredDoctors.length === 0 && !isLoading" class="empty-state">
				<u-empty mode="data" text="暂无医生信息"></u-empty>
			</view>

			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading-state">
				<u-loading-icon></u-loading-icon>
				<text>加载中...</text>
			</view>
		</scroll-view>

		<!-- 底部导航栏 -->
		<custom-tab-bar></custom-tab-bar>
	</view>
</template>

<script setup>
import CustomTabBar from '@/components/custom-tab-bar.vue'
import { useTabBarStore } from '@/store/tabBar'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDoctorList } from '@/api/doctor'

const store = useTabBarStore()
const doctors = ref([])
const searchKeyword = ref('')
const isLoading = ref(false)
const isRefreshing = ref(false)

// 过滤后的医生列表
const filteredDoctors = computed(() => {
	if (!searchKeyword.value) return doctors.value

	const keyword = searchKeyword.value.toLowerCase()
	return doctors.value.filter(doctor => {
		return doctor.name.toLowerCase().includes(keyword) ||
			doctor.hospital.toLowerCase().includes(keyword) ||
			doctor.introduction.toLowerCase().includes(keyword)
	})
})

// 获取医生列表
const fetchDoctors = async () => {
	isLoading.value = true
	try {
		const response = await getDoctorList()
		if (response && response.code === 200 && Array.isArray(response.data)) {
			doctors.value = response.data.map(doctor => ({
				...doctor,
				avatar: doctor.image || '/static/default-avatar.png',
				registration_fee: 50, // 默认值，后端未返回时使用
				appointment_fee: 100  // 默认值，后端未返回时使用
			}))
		} else {
			throw new Error('获取医生列表失败：无效的响应格式')
		}
	} catch (error) {
		console.error('获取医生列表失败:', error)
		uni.showToast({
			title: error.message || '获取医生列表失败',
			icon: 'none'
		})
	} finally {
		isLoading.value = false
		isRefreshing.value = false
	}
}

// 刷新医生列表
const refreshDoctorList = async () => {
	isRefreshing.value = true
	await fetchDoctors()
}

// 搜索处理
const handleSearch = () => {
	// 搜索逻辑已通过计算属性实现
}

// 选择医生
const selectDoctor = (doctor) => {
	// 存储选中的医生信息
	uni.setStorageSync('selectedDoctor', doctor)
	// 跳转到预约日期选择页面
	uni.navigateTo({
		url: `/pages/patient/appointment-date?doctorId=${doctor.id}`,
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
	store.setCurrentPath('/pages/patient/consultation')
	fetchDoctors()
})
</script>

<style lang="scss" scoped>
.consultation-container {
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

.search-box {
	padding: 20rpx 32rpx;
	background: #FFFFFF;
}

.doctor-list {
	padding: 20rpx 32rpx;
	box-sizing: border-box;
	height: calc(100vh - 320rpx);
}

.doctor-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	display: flex;
	gap: 24rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.avatar-section {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		overflow: hidden;
		background: #F5F5F5;
		flex-shrink: 0;

		.avatar {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.info-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-width: 0;

		.top-row {
			display: flex;
			align-items: center;
			gap: 16rpx;
			margin-bottom: 8rpx;

			.name {
				font-size: 32rpx;
				font-weight: 500;
				color: #333333;
			}

			.tag {
				transform: scale(0.8);
				transform-origin: left center;
			}
		}

		.hospital {
			font-size: 28rpx;
			color: #666666;
			margin-bottom: 8rpx;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.description {
			font-size: 24rpx;
			color: #999999;
			line-height: 1.4;
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
		}

		.expertise {
			font-size: 24rpx;
			color: #666666;
			margin-top: 8rpx;
		}
	}

	.fee-section {
		min-width: 160rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		flex-shrink: 0;

		.fee-row {
			display: flex;
			align-items: center;
			margin-bottom: 8rpx;
			white-space: nowrap;

			&:last-child {
				margin-bottom: 0;
			}

			.label {
				font-size: 24rpx;
				color: #666666;
			}

			.value {
				font-size: 24rpx;
				color: #333333;
				font-weight: 500;
			}
		}
	}
}

.empty-state {
	padding: 60rpx 0;
	display: flex;
	flex-direction: column;
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