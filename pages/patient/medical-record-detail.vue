<template>
	<view class="medical-record-detail-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">病历详情</text>
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

				<!-- 皮肤图片 -->
				<view class="info-card" v-if="record.image">
					<view class="card-title">皮肤图片</view>
					<view class="image-container">
						<image :src="getImageSrc(record.image)" mode="aspectFit" class="skin-image"
							@click="previewImage"></image>
					</view>
				</view>

				<!-- 患者信息 -->
				<!-- <view class="info-card">
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
				</view> -->

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

				<!-- 免责声明 -->
				<view class="info-card" v-if="record.disclaimer">
					<view class="card-title">免责声明</view>
					<view class="description-content disclaimer">
						{{ record.disclaimer }}
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
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMedicalRecords } from '@/api/patient'

const props = defineProps({
	id: {
		type: String,
		default: ''
	},
	analysisResult: {
		type: String,
		default: ''
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

// 获取图片源
const getImageSrc = (imageData) => {
	// 检查是否是base64数据
	if (imageData && typeof imageData === 'string') {
		// 如果已经是完整的data URL，直接返回
		if (imageData.startsWith('data:image')) {
			return imageData;
		}
		// 否则，添加前缀
		return `data:image/jpeg;base64,${imageData}`;
	}
	// 如果是URL，直接返回
	return imageData;
}

// 获取病历详情
const fetchRecordDetail = async () => {
	isLoading.value = true
	try {
		// 检查是否有从URL参数传入的诊断结果
		if (props.analysisResult) {
			try {
				// 解析诊断结果
				const analysisData = JSON.parse(decodeURIComponent(props.analysisResult));
				console.log('从URL参数获取的诊断结果:', analysisData);

				// 使用诊断结果构建病历记录
				record.value = {
					id: analysisData.id || `temp-${Date.now()}`,
					name: analysisData.patient_name || analysisData.name || '未知',
					gender: analysisData.gender || '未知',
					age: analysisData.age || '未知',
					phone_number: analysisData.phone_number || '',
					symptoms_description: analysisData.symptoms_description || analysisData.disease_name || '未知症状',
					detailed_description: analysisData.detailed_description || '',
					condition_analysis: analysisData.condition_analysis || analysisData.analysis || '',
					drug_recommendation: analysisData.drug_recommendation || analysisData.recommendation || '',
					created_at: analysisData.created_at || analysisData.timestamp || new Date().toISOString(),
					updated_at: analysisData.updated_at || analysisData.timestamp || new Date().toISOString(),
					image_url: analysisData.image_url || '',
					image_base64: analysisData.image_base64 || '',
					image: analysisData.image || '', // 添加image字段
					confidence: analysisData.confidence || 0,
					disclaimer: analysisData.disclaimer || '本结果仅供参考，具体诊疗请遵医嘱'
				};

				isLoading.value = false;
				return;
			} catch (error) {
				console.error('解析诊断结果失败:', error);
				// 如果解析失败，继续尝试通过ID获取病历
			}
		}

		// 如果没有诊断结果或解析失败，则通过ID获取病历
		if (props.id) {
			// 获取病历列表
			const response = await getMedicalRecords()
			if (response && Array.isArray(response)) {
				// 从列表中筛选出当前ID的病历
				const foundRecord = response.find(item => item.id.toString() === props.id)
				if (foundRecord) {
					// 处理图片数据
					if (foundRecord.image) {
						console.log('病历中包含图片数据');
					} else if (foundRecord.image_url) {
						foundRecord.image = foundRecord.image_url;
					} else if (foundRecord.image_base64) {
						foundRecord.image = foundRecord.image_base64;
					}

					record.value = foundRecord
				} else {
					throw new Error('未找到对应的病历记录')
				}
			} else {
				throw new Error('获取病历列表失败：无效的响应格式')
			}
		} else {
			throw new Error('未提供病历ID或诊断结果')
		}
	} catch (error) {
		console.error('获取病历详情失败:', error)
		uni.showToast({
			title: error.message || '获取病历详情失败',
			icon: 'none'
		})
	} finally {
		isLoading.value = false
		isRefreshing.value = false
	}
}

// 预览图片
const previewImage = () => {
	if (record.value.image) {
		uni.previewImage({
			urls: [getImageSrc(record.value.image)],
			current: 0
		});
	}
}

// 刷新详情
const refreshDetail = async () => {
	isRefreshing.value = true
	await fetchRecordDetail()
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

		&.disclaimer {
			color: #999999;
			font-size: 26rpx;
			font-style: italic;
			background-color: #F8F9FA;
			padding: 16rpx;
			border-radius: 8rpx;
			border-left: 4rpx solid #CCCCCC;
		}
	}

	.image-container {
		position: relative;
		width: 100%;
		margin: 20rpx 0;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
		background-color: #f8f8f8;
		display: flex;
		justify-content: center;
		align-items: center;

		.skin-image {
			width: 100%;
			height: 500rpx;
			display: block;
			object-fit: contain;
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