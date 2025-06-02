<template>
	<view class="ai-assistant">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 头部固定定位 -->
		<view class="header fixed-header">
			<view class="back-btn" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">AI 健康助手</text>
			<view class="subtitle">随时为您解答健康问题</view>
			<view class="clear-btn" @click="clearHistory">
				<u-icon name="delete" color="#333333" size="20"></u-icon>
			</view>
		</view>

		<!-- 优化后的聊天区域 -->
		<scroll-view class="chat-container" :style="{ 'margin-top': headerHeight + 'px' }" scroll-y="true"
			:scroll-top="scrollTop" :scroll-with-animation="true" @scrolltoupper="loadMoreMessages" refresher-enabled
			:refresher-triggered="isRefreshing" @refresherrefresh="onRefresh">
			<view class="chat-list">
				<!-- 欢迎消息 -->
				<view class="system-message">
					<text>🌟 健康顾问小安随时为您服务</text>
				</view>

				<!-- 消息列表 -->
				<view v-for="(message, index) in messages" :key="index" :class="['message-wrapper', message.type]"
					:style="{ '--enter-delay': index * 0.1 + 's' }">
					<view class="message-bubble" @longpress="showCopyMenu(message.content)">
						<text class="content">{{ message.content }}</text>
						<text class="time">{{ message.time }}</text>
					</view>
				</view>

				<!-- 优化加载动画 -->
				<view v-if="isLoading" class="typing-indicator">
					<view class="dot"></view>
					<view class="dot"></view>
					<view class="dot"></view>
				</view>

				<!-- 骨架屏加载 -->
				<view v-if="isLoading" class="skeleton-message">
					<view class="message-bubble"></view>
				</view>
			</view>
		</scroll-view>

		<!-- 优化后的输入区域 -->
		<view class="input-container" :style="{ bottom: keyboardHeight + 'px' }">
			<view class="input-wrapper">
				<textarea v-model="inputMessage" class="input" :adjust-position="false" :cursor-spacing="20"
					:show-confirm-bar="false" :maxlength="-1" placeholder="输入健康问题..." @focus="handleFocus"
					@blur="handleBlur" :style="{ height: textareaHeight + 'px' }" @input="adjustTextareaHeight"
					@confirm="sendMessage"></textarea>
				<view :class="['send-btn', isTouching ? 'send-btn-active' : '']" @touchstart="handleTouchStart"
					@touchend="handleTouchEnd" @touchcancel="handleTouchEnd" @click="sendMessage"
					:style="{ opacity: inputMessage.trim() ? 1 : 0.5 }">
					<u-icon name="arrow-right" color="#FFFFFF" size="20"></u-icon>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { request } from '@/utils/request'
import { communicateWithAI } from '@/api/ai'
import { getBaseUrl } from '@/config'

// 消息列表
const messages = ref([])
// 输入内容
const inputMessage = ref('')
// 滚动位置
const scrollTop = ref(0)
// 加载状态
const isLoading = ref(false)
// 刷新状态
const isRefreshing = ref(false)
// 文本框高度
const textareaHeight = ref(40)
// 基础文本框高度
const baseTextareaHeight = 40
// 头部高度
const headerHeight = ref(0)
// 键盘高度
const keyboardHeight = ref(0)
let isSending = false
// 添加一个ref来控制按钮状态
const isTouching = ref(false)

// 调整文本框高度
const adjustTextareaHeight = (e) => {
	const lineHeight = 20
	const maxHeight = 120
	const scrollHeight = e.detail.height || baseTextareaHeight
	textareaHeight.value = Math.min(Math.max(scrollHeight, baseTextareaHeight), maxHeight)
}

// 发送消息
const sendMessage = async () => {
	if (isSending || !inputMessage.value.trim()) return

	try {
		isSending = true
		// 添加用户消息
		const userMessage = {
			type: 'user',
			content: inputMessage.value,
			time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
		}
		messages.value.push(userMessage)

		// 清空输入
		const userQuestion = inputMessage.value.trim()
		inputMessage.value = ''
		textareaHeight.value = baseTextareaHeight

		// 滚动到底部
		await nextTick()
		scrollToBottom()

		// 发送请求到AI
		isLoading.value = true
		try {
			console.log('发送问题到AI:', userQuestion)
			const response = await communicateWithAI(userQuestion)
			console.log('AI响应:', response)

			// 添加AI回复
			let aiContent = '抱歉，我无法理解您的问题。'

			// 正确处理API响应格式
			if (response && response.data) {
				aiContent = response.data
			} else if (response && response.message) {
				aiContent = response.message
			} else if (response && typeof response === 'string') {
				aiContent = response
			} else if (response && response.answer) {
				aiContent = response.answer
			} else if (response && response.response) {
				aiContent = response.response
			}

			const aiMessage = {
				id: Date.now() + 1,
				type: 'ai',
				content: aiContent,
				time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
			}
			messages.value.push(aiMessage)

			// 保存聊天记录
			saveToHistory(messages.value)
		} catch (error) {
			console.error('AI响应失败:', error)
			let errorMessage = '抱歉，服务器暂时无法响应，请稍后再试。'

			// 尝试提取更具体的错误信息
			if (error && error.message) {
				errorMessage = `抱歉，出现了问题: ${error.message}`
			} else if (error && error.detail) {
				errorMessage = `抱歉，出现了问题: ${JSON.stringify(error.detail)}`
			}

			const aiMessage = {
				type: 'ai',
				content: errorMessage,
				time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
			}
			messages.value.push(aiMessage)
		}
	} finally {
		isLoading.value = false
		isSending = false
		scrollToBottom()
	}
}

// 复制消息内容
const showCopyMenu = (content) => {
	uni.showActionSheet({
		itemList: ['复制内容'],
		success: () => {
			uni.setClipboardData({
				data: content,
				success: () => {
					uni.showToast({
						title: '已复制',
						icon: 'success'
					})
				}
			})
		}
	})
}

// 发送按钮触摸反馈
const handleTouchStart = () => {
	if (inputMessage.value.trim()) {
		// 使用uni的选择器API而不是DOM API
		const query = uni.createSelectorQuery()
		query.select('.send-btn').boundingClientRect(data => {
			if (data) {
				// 使用样式类来处理按钮缩放效果
				isTouching.value = true
			}
		}).exec()
	}
}

const handleTouchEnd = () => {
	// 使用uni的选择器API而不是DOM API
	isTouching.value = false
}

// 滚动到底部
const scrollToBottom = () => {
	nextTick(() => {
		// 修复 selector query 问题
		const query = uni.createSelectorQuery()
		query.select('.chat-container').boundingClientRect()
		query.select('.chat-list').boundingClientRect()
		query.exec(([container, list]) => {
			if (container && list) {
				scrollTop.value = list.height - container.height
			}
		})
	})
}

// 加载更多消息
const loadMoreMessages = () => {
	console.log('加载更多消息')
}

// 下拉刷新
const onRefresh = () => {
	isRefreshing.value = true
	setTimeout(() => {
		isRefreshing.value = false
	}, 1000)
}

// 处理输入框焦点
const handleFocus = () => {
	scrollToBottom()
}

const handleBlur = () => {
	// 处理失去焦点
}

// 返回上一页
const handleBack = () => {
	// 获取当前页面栈
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
	} else {
		// 如果是首页，则切换到首页tab
		uni.switchTab({
			url: '/pages/patient/index'
		})
	}
}

// 保存聊天记录
const saveToHistory = (messages) => {
	try {
		// 获取现有历史记录
		const historyStr = uni.getStorageSync('ai_chat_history') || '[]'
		let history = []

		try {
			history = JSON.parse(historyStr)
			if (!Array.isArray(history)) {
				history = []
			}
		} catch (e) {
			console.error('解析历史记录失败，重置历史记录:', e)
			history = []
		}

		// 构建记录对象，只保存最后一条AI回复和用户问题
		const lastUserMessage = messages.filter(m => m.type === 'user').pop()
		const lastAIMessage = messages.filter(m => m.type === 'ai').pop()

		if (lastUserMessage && lastAIMessage) {
			const record = {
				id: Date.now().toString(),
				timestamp: new Date().toISOString(),
				question: lastUserMessage.content,
				answer: lastAIMessage.content,
				created_at: new Date().toLocaleString()
			}

			// 检查是否已存在相同的问答
			const existingIndex = history.findIndex(item =>
				item.question === record.question &&
				item.answer === record.answer
			)

			if (existingIndex === -1) {
				// 添加新记录到开头
				history.unshift(record)

				// 最多保存20条记录
				if (history.length > 20) {
					history = history.slice(0, 20)
				}

				// 保存回本地存储
				uni.setStorageSync('ai_chat_history', JSON.stringify(history))
				console.log('保存历史记录成功:', record)
			}
		}
	} catch (e) {
		console.error('保存历史记录失败:', e)
	}
}

// 加载历史记录
const loadHistory = () => {
	try {
		const historyStr = uni.getStorageSync('ai_chat_history') || '[]'
		const history = JSON.parse(historyStr)
		if (Array.isArray(history) && history.length > 0) {
			// 获取最近一次对话
			const lastChat = history[0]
			if (lastChat) {
				// 转换为消息格式
				messages.value = [
					{
						type: 'user',
						content: lastChat.question,
						time: new Date(lastChat.timestamp).toLocaleTimeString('zh-CN', { hour12: false })
					},
					{
						type: 'ai',
						content: lastChat.answer,
						time: new Date(lastChat.timestamp).toLocaleTimeString('zh-CN', { hour12: false })
					}
				]
				scrollToBottom()
			}
		}
	} catch (e) {
		console.error('加载历史记录失败:', e)
	}
}

// 添加查看历史记录功能
const viewHistory = () => {
	try {
		const historyStr = uni.getStorageSync('ai_chat_history') || '[]'
		const history = JSON.parse(historyStr)
		if (Array.isArray(history) && history.length > 0) {
			uni.showActionSheet({
				itemList: history.map(item => item.question.slice(0, 20) + '...'),
				success: (res) => {
					const selectedChat = history[res.tapIndex]
					messages.value = [
						{
							type: 'user',
							content: selectedChat.question,
							time: new Date(selectedChat.timestamp).toLocaleTimeString('zh-CN', { hour12: false })
						},
						{
							type: 'ai',
							content: selectedChat.answer,
							time: new Date(selectedChat.timestamp).toLocaleTimeString('zh-CN', { hour12: false })
						}
					]
					scrollToBottom()
				}
			})
		} else {
			uni.showToast({
				title: '暂无历史记录',
				icon: 'none'
			})
		}
	} catch (e) {
		console.error('查看历史记录失败:', e)
	}
}

// 添加清空聊天记录的功能
const clearHistory = () => {
	uni.showModal({
		title: '提示',
		content: '确定要清空聊天记录吗？',
		success: (res) => {
			if (res.confirm) {
				messages.value = []
				uni.removeStorageSync('ai_chat_history')
				uni.showToast({
					title: '已清空聊天记录',
					icon: 'success'
				})
			}
		}
	})
}

// 页面加载完成
onMounted(() => {
	// 计算头部高度
	const query = uni.createSelectorQuery()
	query.select('.fixed-header').boundingClientRect(data => {
		if (data) {
			headerHeight.value = data.height + 10 // 增加安全间距
		}
	}).exec()

	// 加载历史记录
	loadHistory()

	scrollToBottom()

	// 监听键盘高度变化
	uni.onKeyboardHeightChange(res => {
		keyboardHeight.value = res.height > 0 ? res.height + 20 : 0
	})
})

onUnmounted(() => {
	uni.offKeyboardHeightChange()
})
</script>

<style lang="scss" scoped>
/* 颜色变量 */
:root {
	--primary-color: #5B8CFF;
	--ai-bg: #F5F7FA;
	--user-bg: linear-gradient(135deg, #5B8CFF 0%, #8B5CFF 100%);
}

.ai-assistant {
	min-height: 100vh;
	background-color: #f7f7f7;
	display: flex;
	flex-direction: column;
	position: relative;
	padding-bottom: env(safe-area-inset-bottom);

	.fixed-header {
		position: fixed;
		top: var(--status-bar-height);
		left: 0;
		right: 0;
		z-index: 1000;
		background: #ffffff;
		padding: 20rpx 40rpx;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		transition: box-shadow 0.3s;

		.back-btn {
			margin-right: 20rpx;
			padding: 10rpx;
			height: 44rpx;
			width: 44rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.title {
			font-size: 36rpx;
			font-weight: 600;
			color: #000;
		}

		.subtitle {
			font-size: 24rpx;
			color: #666;
			margin-left: 20rpx;
		}

		.clear-btn {
			margin-left: auto;
			padding: 10rpx;
			height: 44rpx;
			width: 44rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		&.scrolling {
			box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
		}
	}

	.chat-container {
		flex: 1;
		height: calc(100vh - 160rpx);
		padding: 40rpx 20rpx 20rpx;
		position: relative;

		.chat-list {
			padding-bottom: 120rpx;
		}

		.message-wrapper {
			margin-bottom: 30rpx;

			&.user {
				.message-bubble {
					background: var(--user-bg);
					color: #FFFFFF;

					&::after {
						content: '';
						position: absolute;
						right: -8px;
						top: 12px;
						border: 10px solid transparent;
						border-left-color: var(--primary-color);
					}
				}
			}

			&.ai .message-bubble {
				background: var(--ai-bg);

				&::after {
					content: '';
					position: absolute;
					left: -8px;
					top: 12px;
					border: 10px solid transparent;
					border-right-color: var(--ai-bg);
				}
			}

			.message-bubble {
				max-width: 80%;
				padding: 20rpx 28rpx;
				border-radius: 16rpx;
				position: relative;
				transition: transform 0.2s;

				.content {
					font-size: 30rpx;
					line-height: 1.6;
					color: inherit;
				}

				.time {
					display: block;
					font-size: 24rpx;
					color: rgba(0, 0, 0, 0.4);
					margin-top: 12rpx;
					text-align: right;
				}

				&:active {
					transform: scale(0.98);
				}
			}
		}

		.system-message {
			text-align: center;
			margin: 40rpx 0;

			text {
				display: inline-block;
				padding: 12rpx 36rpx;
				background: rgba(91, 140, 255, 0.1);
				color: var(--primary-color);
				border-radius: 40rpx;
				font-size: 26rpx;
			}
		}
	}

	.typing-indicator {
		display: flex;
		gap: 8rpx;
		padding: 24rpx 32rpx;

		.dot {
			width: 12rpx;
			height: 12rpx;
			background: var(--primary-color);
			border-radius: 50%;
			animation: wave 1.2s infinite ease-in-out;

			&:nth-child(2) {
				animation-delay: 0.2s;
			}

			&:nth-child(3) {
				animation-delay: 0.4s;
			}
		}
	}

	.skeleton-message {
		animation: skeleton-loading 1.5s infinite;
		background: linear-gradient(90deg,
				rgba(245, 247, 250, 1) 25%,
				rgba(230, 233, 237, 1) 50%,
				rgba(245, 247, 250, 1) 75%);
		background-size: 400% 400%;
		padding: 0 32rpx;
		margin-bottom: 24rpx;

		.message-bubble {
			width: 60%;
			height: 120rpx;
			background: var(--ai-bg);
			border-radius: 16rpx;
		}
	}

	.input-container {
		position: fixed;
		left: 0;
		right: 0;
		transition: all 0.3s ease;
		padding: 20rpx;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);

		.input-wrapper {
			background: #fff;
			border-radius: 48rpx;
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
			padding: 16rpx 24rpx;
			display: flex;
			align-items: flex-end;
			gap: 16rpx;
		}

		.input {
			flex: 1;
			min-height: 80rpx;
			max-height: 160rpx;
			padding: 20rpx;
			font-size: 30rpx;
			background: transparent;
		}

		.send-btn {
			width: 80rpx;
			height: 80rpx;
			background: #007AFF;
			border-radius: 40rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-left: 20rpx;
			transition: transform 0.2s;

			&-active {
				transform: scale(0.95);
			}
		}
	}
}

@keyframes wave {

	0%,
	60%,
	100% {
		transform: translateY(0);
	}

	30% {
		transform: translateY(-12rpx);
	}
}

@keyframes skeleton-loading {
	0% {
		background-position: 100% 50%;
	}

	100% {
		background-position: 0 50%;
	}
}
</style>