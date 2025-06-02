<template>
	<view class="disease-info-input">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 返回按钮 -->
		<view class="back-btn">
			<u-icon name="arrow-left" color="#333333" size="20" @click="handleBack"></u-icon>
		</view>

		<!-- 标题 -->
		<view class="title">补充信息</view>

		<!-- 上传的照片 -->
		<view class="photo-section">
			<image :src="initialData.image" mode="aspectFit" class="uploaded-photo"></image>
		</view>

		<!-- 初步检测结果 -->
		<view class="initial-result">
			<view class="result-title">初步检测结果</view>
			<view class="result-content">
				<view class="disease-name">{{ initialData.disease_name || '未知疾病' }}</view>
				<view class="confidence">可信度: {{ (initialData.confidence * 100).toFixed(2) }}%</view>
			</view>
		</view>

		<!-- 表单区域 -->
		<view class="form-section">
			<view class="form-title">请确认病症描述</view>

			<!-- 病症描述 -->
			<view class="form-item">
				<view class="form-label">病症描述</view>
				<view class="form-input">
					<textarea v-model="formData.text" placeholder="请确认或修改病症描述" class="disease-textarea" />
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-btn" @click="handleSubmit">获取详细分析</view>
	</view>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { useAnalysisStore } from '@/stores/analysisStore'
import { getIllnessAnalysis } from '@/api/ai'
import { getBaseUrl } from '@/config'

// 获取store
const userInfoStore = useUserInfoStore()
const analysisStore = useAnalysisStore()

// 初始数据
const initialData = ref({
	image: '',
	disease_name: '',
	confidence: 0
})

// 表单数据
const formData = ref({
	text: ''
})

// 微信小程序专用的onLoad生命周期函数
function onLoad (options) {
	console.log('微信小程序onLoad生命周期触发', options);

	// 从页面参数中获取初始数据
	if (options && options.initialData) {
		try {
			const data = JSON.parse(decodeURIComponent(options.initialData));
			console.log('从页面参数获取到初始数据:', data);
			initialData.value = data;

			// 预填充病症描述
			if (data.disease_name) {
				formData.value.text = data.disease_name;
			}
		} catch (e) {
			console.error('解析页面参数失败:', e);
		}
	}
}

// 添加onMounted生命周期钩子
onMounted(async () => {
	console.log('onMounted触发');

	// 获取页面参数
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1];

	if (currentPage && currentPage.options && currentPage.options.initialData) {
		try {
			const data = JSON.parse(decodeURIComponent(currentPage.options.initialData));
			console.log('从页面参数获取到初始数据:', data);
			initialData.value = data;

			// 预填充病症描述
			if (data.disease_name) {
				formData.value.text = data.disease_name;
			}
		} catch (e) {
			console.error('解析页面参数失败:', e);
		}
	}

	// 从用户信息中获取年龄和性别
	try {
		// 获取用户信息
		await userInfoStore.fetchUserInfo();

		// 如果用户信息中有年龄和性别，则使用用户信息中的数据
		if (userInfoStore.age) {
			formData.value.age = userInfoStore.age;
		}

		if (userInfoStore.gender) {
			formData.value.gender = userInfoStore.gender;
		}

		console.log('从用户信息中获取到年龄和性别:', formData.value.age, formData.value.gender);
	} catch (error) {
		console.error('获取用户信息失败:', error);
	}
});

// 提交表单
const handleSubmit = async () => {
	// 表单验证
	if (!formData.value.text) {
		uni.showToast({
			title: '请输入病症描述',
			icon: 'none'
		});
		return;
	}

	try {
		uni.showLoading({
			title: '分析中...',
			mask: true
		});

		// 调用API获取详细分析结果
		try {
			const response = await getIllnessAnalysis(formData.value.text);
			
			// 处理API响应
			if (response && response.data) {
				console.log('API返回详细分析结果:', response.data);
				
				// 构建完整的分析结果对象
				const fullAnalysisResult = {
					...initialData.value,
					analysis: response.data.data?.analysis || '',
					disclaimer: response.data.data?.disclaimer || ''
				};
				
				console.log('完整的分析结果:', fullAnalysisResult);
				
				// 将分析结果转换为URL参数
				const analysisResultParam = encodeURIComponent(JSON.stringify(fullAnalysisResult));
				
				// 跳转到详情页面
				uni.redirectTo({
					url: `/pages/patient/medical-record-detail?analysisResult=${analysisResultParam}`,
					fail: (error) => {
						console.error('跳转失败:', error);
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						});
					}
				});
			} else {
				throw new Error('获取详细分析失败');
			}
		} catch (error) {
			uni.hideLoading();
			console.error('获取分析结果失败:', error);
			uni.showToast({
				title: '获取分析结果失败',
				icon: 'none'
			});
		}
	} catch (error) {
		uni.hideLoading();
		console.error('获取详细分析失败:', error);
		uni.showToast({
			title: '获取详细分析失败',
			icon: 'none'
		});
	}
};

// 返回上一页
const handleBack = () => {
	uni.navigateBack();
};

// 暴露方法给父组件
defineExpose({
	onLoad
});
</script>

<style lang="scss" scoped>
.disease-info-input {
	padding: 20px;
	min-height: 100vh;
	background-color: #f5f5f5;

	.back-btn {
		margin-bottom: 20px;
	}

	.title {
		font-size: 24px;
		font-weight: bold;
		margin-bottom: 30px;
		color: #333;
	}

	.photo-section {
		margin-bottom: 20px;
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;

		.uploaded-photo {
			width: 100%;
			height: 200px;
			border-radius: 8px;
		}
	}

	.initial-result {
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;
		margin-bottom: 20px;

		.result-title {
			font-size: 16px;
			font-weight: bold;
			margin-bottom: 10px;
			color: #333;
		}

		.result-content {
			.disease-name {
				font-size: 18px;
				color: #333;
				margin-bottom: 5px;
			}

			.confidence {
				font-size: 14px;
				color: #666;
			}
		}
	}

	.form-section {
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;
		margin-bottom: 30px;

		.form-title {
			font-size: 16px;
			font-weight: bold;
			margin-bottom: 20px;
			color: #333;
		}

		.form-item {
			margin-bottom: 15px;

			.form-label {
				font-size: 14px;
				color: #333;
				margin-bottom: 8px;
			}

			.form-input {
				.disease-textarea {
					width: 100%;
					height: 120px;
					background-color: #f8f8f8;
					border-radius: 8px;
					padding: 10px;
					font-size: 14px;
				}
			}
		}
	}

	.submit-btn {
		background-color: #007AFF;
		color: #fff;
		text-align: center;
		padding: 12px;
		border-radius: 25px;
		font-size: 16px;
		margin: 0 20px;

		&:active {
			opacity: 0.8;
		}
	}
}
</style>