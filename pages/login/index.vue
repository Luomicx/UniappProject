<template>
	<view class="login-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- Logo区域 -->
		<view class="logo-section">
			<image class="logo" src="/static/1LOGO.png" mode="aspectFit"></image>
			<text class="app-name">AI皮肤病诊断系统</text>
			<text class="slogan">专业、便捷的皮肤健康管理平台</text>
		</view>

		<!-- 表单区域 -->
		<view class="form-section">
			<view class="input-group">
				<view class="input-item">
					<u-icon name="account" size="24" color="#999"></u-icon>
					<input type="text" v-model="formData.username" placeholder="请输入手机号码"
						placeholder-style="color: #BBBBBB;" @blur="validatePhone" />
				</view>
				<view class="input-item">
					<u-icon name="lock" size="24" color="#999"></u-icon>
					<input :type="showPassword ? 'text' : 'password'" v-model="formData.password" placeholder="请输入密码"
						placeholder-style="color: #BBBBBB;" @input="checkPasswordStrength" />
					<u-icon :name="showPassword ? 'eye' : 'eye-off'" size="24" color="#999"
						@click="togglePasswordVisibility"></u-icon>
				</view>

				<!-- 密码强度提示 -->
				<view class="password-strength" v-if="isRegistering && formData.password">
					<text class="strength-label">密码强度:</text>
					<view class="strength-bars">
						<view class="bar" :class="{ active: passwordStrength >= 1 }"></view>
						<view class="bar" :class="{ active: passwordStrength >= 2 }"></view>
						<view class="bar" :class="{ active: passwordStrength >= 3 }"></view>
					</view>
					<text class="strength-text" :class="strengthClass">{{ strengthText }}</text>
				</view>
			</view>

			<view class="error-message" v-if="errorMessage">
				<u-icon name="info-circle" size="16" color="#FF6B6B"></u-icon>
				<text>{{ errorMessage }}</text>
			</view>

			<!-- 提示信息 -->
			<view class="tip-message" v-if="tipMessage">
				<u-icon name="info-circle" size="16" color="#4CD964"></u-icon>
				<text>{{ tipMessage }}</text>
			</view>
		</view>

		<!-- 按钮区域 -->
		<view class="button-group">
			<button class="login-btn" :disabled="isLoading" @click="handleMainAction">
				<u-loading-icon v-if="isLoading" mode="circle" color="#FFFFFF" size="24"></u-loading-icon>
				<text v-else>{{ isRegistering ? '注册' : '登录' }}</text>
			</button>
			<button class="register-btn" :disabled="isLoading" @click="toggleMode">
				{{ isRegistering ? '已有账号，去登录' : '没有账号，去注册' }}
			</button>
		</view>

		<!-- 底部信息 -->
		<view class="footer-info">
			<text>{{ isRegistering ? '注册' : '登录' }}即表示您同意</text>
			<text class="link" @click="showAgreement('user')">用户协议</text>
			<text>和</text>
			<text class="link" @click="showAgreement('privacy')">隐私政策</text>
		</view>

		<!-- 注册成功提示弹窗 -->
		<u-popup :show="showRegisterSuccess" mode="center" @close="closeRegisterSuccess">
			<view class="success-popup">
				<u-icon name="checkmark-circle" color="#4CD964" size="60"></u-icon>
				<text class="success-title">注册成功</text>
				<text class="success-message">您的账号已创建成功，即将为您自动登录</text>
				<button class="success-btn" @click="closeRegisterSuccess">确定</button>
			</view>
		</u-popup>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { register, login } from '@/api/auth'

const formData = ref({
	username: '',
	password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const tipMessage = ref('')
const isRegistering = ref(false)
const showPassword = ref(false)
const passwordStrength = ref(0)
const showRegisterSuccess = ref(false)

// 处理主按钮点击事件
const handleMainAction = () => {
	if (isRegistering.value) {
		handleRegister()
	} else {
		handleLogin()
	}
}

// 切换登录/注册模式
const toggleMode = () => {
	isRegistering.value = !isRegistering.value
	errorMessage.value = ''
	tipMessage.value = isRegistering.value ? '请使用手机号注册，密码至少6位' : ''
}

// 切换密码可见性
const togglePasswordVisibility = () => {
	showPassword.value = !showPassword.value
}

// 验证手机号
const validatePhone = () => {
	if (!formData.value.username) return

	const phoneRegex = /^1[3-9]\d{9}$/
	if (!phoneRegex.test(formData.value.username)) {
		errorMessage.value = '请输入正确的手机号码'
		return false
	}

	errorMessage.value = ''
	return true
}

// 检查密码强度
const checkPasswordStrength = () => {
	const password = formData.value.password

	if (!password) {
		passwordStrength.value = 0
		return
	}

	let strength = 0

	// 长度检查
	if (password.length >= 6) strength += 1

	// 包含数字和字母
	if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) strength += 1

	// 包含特殊字符
	if (/[^a-zA-Z0-9]/.test(password)) strength += 1

	passwordStrength.value = strength
}

// 密码强度文本
const strengthText = computed(() => {
	switch (passwordStrength.value) {
		case 0: return '弱'
		case 1: return '弱'
		case 2: return '中'
		case 3: return '强'
		default: return ''
	}
})

// 密码强度样式类
const strengthClass = computed(() => {
	switch (passwordStrength.value) {
		case 0: return 'weak'
		case 1: return 'weak'
		case 2: return 'medium'
		case 3: return 'strong'
		default: return ''
	}
})

// 关闭注册成功弹窗
const closeRegisterSuccess = () => {
	showRegisterSuccess.value = false
	// 自动切换到登录模式
	isRegistering.value = false

	// 清除错误信息
	errorMessage.value = ''
	tipMessage.value = ''

	// 自动填充刚注册的用户名和密码
	// 然后自动登录
	setTimeout(() => {
		handleLogin()
	}, 300)
}

// 处理注册
const handleRegister = async () => {
	try {
		// 清除之前的错误信息
		errorMessage.value = ''
		tipMessage.value = ''

		// 表单验证
		if (!formData.value.username) {
			errorMessage.value = '请输入手机号码'
			return
		}

		// 验证手机号格式
		if (!validatePhone()) {
			return
		}

		if (!formData.value.password) {
			errorMessage.value = '请输入密码'
			return
		}

		if (formData.value.password.length < 6) {
			errorMessage.value = '密码长度不能少于6位'
			return
		}

		// 显示加载状态
		isLoading.value = true

		// 调用注册接口
		const response = await register({
			phone_number: formData.value.username,
			password: formData.value.password
		})

		// 检查响应
		if (response) {
			// 显示注册成功弹窗
			showRegisterSuccess.value = true
		}
	} catch (error) {
		console.error('注册失败:', error)
		errorMessage.value = error.message || '注册失败，请稍后再试'
	} finally {
		isLoading.value = false
	}
}

// 处理登录
const handleLogin = async () => {
	try {
		// 清除之前的错误信息
		errorMessage.value = ''
		tipMessage.value = ''

		// 表单验证
		if (!formData.value.username) {
			errorMessage.value = '请输入手机号码'
			return
		}

		// 验证手机号格式
		if (!validatePhone()) {
			return
		}

		if (!formData.value.password) {
			errorMessage.value = '请输入密码'
			return
		}

		// 显示加载状态
		isLoading.value = true

		// 调用登录接口
		const response = await login({
			username: formData.value.username,
			password: formData.value.password
		})

		// 检查响应数据中是否包含token
		if (response && response.token) {
			// 保存token和token_type
			uni.setStorageSync('token', response.token)
			uni.setStorageSync('token_type', response.token_type || 'Bearer')

			// 显示成功提示
			uni.showToast({
				title: '登录成功',
				icon: 'success',
				duration: 1500
			})

			// 延迟跳转，让用户看到成功提示
			setTimeout(() => {
				uni.reLaunch({
					url: '/pages/choose-role/index',
					fail: (err) => {
						console.error('跳转失败:', err)
						errorMessage.value = '页面跳转失败'
					}
				})
			}, 1500)
		} else {
			throw new Error('登录失败：未获取到有效的token')
		}
	} catch (error) {
		console.error('登录失败:', error)
		errorMessage.value = error.message || '登录失败，请检查账号密码'
	} finally {
		isLoading.value = false
	}
}

const showAgreement = (types) => {
    let title = '';
    let content = '';

    if (types === 'user') {
        title = '用户协议';
        content = `
在使用本 App 之前，请您务必仔细阅读并充分理解本协议的全部内容，特别是免除或限制责任的条款、法律适用和争议解决条款。如果您不同意本协议的任何内容，您应立即停止使用本 App。

一、总则
1.1 本协议是您与 XXX 公司（以下简称“本公司”）之间就您下载、安装、使用本 App 所订立的协议。
1.2 本协议内容包括协议正文及所有本公司已经发布的或将来可能发布的各类规则、声明、通知、公告等（以下简称“规则”）。所有规则为本协议不可分割的组成部分，与协议正文具有同等法律效力。
1.3 您在使用本 App 提供的各项服务之前，应仔细阅读本协议及相关规则。您一旦使用本 App，即视为您已了解并完全同意本协议及各项规则的内容，并承诺遵守。

二、服务内容
2.1 本 App 是一款提供痘痘诊疗服务的移动应用软件，具体服务内容包括但不限于：
在线问诊：用户可通过图文、语音、视频等方式向平台医生进行在线咨询。
痘痘检测：用户可上传面部照片，由 AI 智能分析痘痘类型和严重程度。
诊疗方案：根据用户情况，提供个性化的诊疗方案，包括药品推荐、护肤建议等。
健康资讯：提供痘痘相关的科普文章、视频等健康资讯。
2.2 本公司有权根据实际情况对服务内容进行调整、更新或优化，并提前进行公告。

三、用户注册与账号
3.1 您在使用本 App 前需要注册账号并登录。
3.2 您注册账号时，应提供真实、准确、完整的信息，并及时更新。
3.3 您应妥善保管您的账号和密码，并对您账号下的一切行为承担法律责任。
3.4 您不得将账号转让、出租或出借给他人使用。

四、用户行为规范
4.1 您在使用本 App 时，必须遵守中华人民共和国法律法规，并尊重社会主义道德风尚
4.2 您不得利用本 App 从事以下行为：
违反宪法或法律法规规定的；
危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的；
损害国家荣誉和利益的；
煽动民族仇恨、民族歧视，破坏民族团结的；
破坏国家宗教政策，宣扬邪教和封建迷信的；
散布谣言，扰乱社会秩序，破坏社会稳定的；
散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的；
侮辱或者诽谤他人，侵害他人合法权益的；
含有法律、行政法规禁止的其他内容的。
4.3 您不得利用本 App 进行任何商业行为，例如发布广告、推销产品等。
4.4 您不得对本 App 进行任何形式的反向工程、反向编译、反汇编，或以其他方式尝试发现本 App 的源代码。
4.5 您不得对本 App 进行任何可能影响其正常运行的行为，例如使用外挂、病毒等。

五、免责条款
5.1 本公司将尽最大努力保障本 App 的正常运行，但不对以下情况承担责任：
因不可抗力、计算机病毒或黑客攻击、系统不稳定、用户所在位置、用户关机以及其他任何技术、网络、通信线路等原因造成的服务中断或不能满足用户要求的风险。
用户因使用本 App 而遭受的任何直接或间接损失，包括但不限于利润损失、数据丢失、业务中断等。
5.2 本 App 提供的在线问诊服务仅供参考，不能替代专业医疗诊断和治疗。用户在使用本 App 提供的服务时，应自行判断并承担相应风险。
5.3 本 App 中可能包含由第三方提供的服务或链接，本公司不对该等第三方服务或链接的准确性、安全性、合法性等作出任何保证，用户应自行判断并承担相应风险。

六、知识产权
6.1 本 App 的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、页面设计等，其著作权、商标权、专利权等知识产权均归本公司所有。
6.2 未经本公司书面许可，您不得以任何方式使用本 App 的任何内容，包括但不限于复制、传播、修改、翻译、汇编、出版等。

七、协议修改
7.1 本公司有权根据法律法规的变化、业务发展需要等对本协议进行修改，修改后的协议将在本 App 上公布。
7.2 如果您继续使用本 App，则视为您接受修改后的协议。

八、法律适用和争议解决
8.1 本协议的订立、执行和解释均适用中华人民共和国法律。
8.2 如双方就本协议内容或其执行发生任何争议，双方应尽量友好协商解决；协商不成时，任何一方均可向本公司所在地有管辖权的人民法院提起诉讼。

九、其他
9.1 本协议构成双方对本协议之约定事项及其他有关事宜的完整协议，除本协议规定的之外，未赋予本协议各方其他权利。
9.2 如本协议中的任何条款无论因何种原因完全或部分无效或不具有执行力，本协议的其余条款仍应有效并且有约束力。
9.3 本协议最终解释权归本公司所有。

感谢您使用痘痘诊疗 App！
AIPF检测助手有限公司
2025 年 3 月 5 日
        `;
    } else if (types === 'privacy') {
        title = '隐私政策';
        content = `
生效日期：2025 年 3 月 5 日\n\n
感谢您使用痘痘诊疗 App（以下简称“本 App”）。我们深知个人信息对您的重要性，并会尽全力保护您的隐私和数据安全。本隐私协议旨在帮助您了解我们如何收集、使用、存储和共享您的个人信息，以及您如何行使您的隐私权利。\n\n
---\n\n
**一、信息的收集与使用**\n\n
1. **个人信息的收集**\n
   在您使用本 App 的过程中，我们可能会收集以下信息：\n
   - **注册信息**：包括您的手机号码、电子邮箱、用户名等。\n
   - **健康信息**：包括您提供的痘痘照片、症状描述、诊疗历史等。\n
   - **设备信息**：包括设备型号、操作系统、IP 地址等。\n
   - **使用信息**：包括您的操作记录、浏览记录、访问时间等。\n\n
2. **信息的使用**\n
   我们收集的信息将用于以下用途：\n
   - 为您提供痘痘诊疗服务，包括在线问诊、痘痘检测、诊疗方案等。\n
   - 优化和改进本 App 的功能和用户体验。\n
   - 向您发送重要通知，如服务变更、更新提醒等。\n
   - 用于数据分析和研究，以提升服务质量。\n\n
---\n\n
**二、信息的共享与披露**\n\n
1. **共享范围**\n
   我们不会将您的个人信息出售给第三方。但在以下情况下，我们可能会共享您的信息：\n
   - **医疗团队**：为提供诊疗服务，您的健康信息可能会共享给平台医生。\n
   - **合作伙伴**：在与第三方合作提供服务时，我们可能会共享必要的信息，但会确保其遵守隐私保护义务。\n
   - **法律法规要求**：如根据法律、法规或政府要求，我们可能会披露您的信息。\n\n
2. **数据安全**\n
   我们采取严格的技术和管理措施，保护您的个人信息免受未经授权的访问、使用或泄露。\n\n
---\n\n
**三、您的权利**\n\n
1. **访问与更正**\n
   您可以随时访问和更正您的个人信息。如需要帮助，请联系我们的客服团队。\n\n
2. **删除信息**\n
   您可以要求删除您的个人信息，但某些情况下（如法律规定）我们可能无法立即删除。\n\n
3. **撤回同意**\n
   您可以随时撤回对我们处理您个人信息的同意，但可能会影响您使用部分服务。\n\n
4. **投诉与建议**\n
   如您对我们的隐私保护措施有任何疑问或建议，请通过以下联系方式与我们联系。\n\n
---\n\n
**四、信息的存储与保留**\n\n
1. **存储地点**\n
   您的个人信息将存储在中国境内的服务器上。\n\n
2. **保留期限**\n
   我们仅在为您提供服务所需的期限内保留您的信息，超出期限后将进行匿名化处理或删除。\n\n
---\n\n
**五、未成年人保护**\n\n
本 App 主要面向成年人。如您未满 18 周岁，请在监护人指导下使用本 App，并确保已获得监护人的同意。\n\n
---\n\n
**六、协议的变更**\n\n
我们可能会根据法律法规或业务需要更新本隐私协议。更新后的协议将在本 App 上公布，并在生效前通过适当方式通知您。\n\n
---\n\n
**七、联系我们**\n\n
如您对本隐私协议或个人信息处理有任何疑问，请通过以下方式联系我们：\n
- 公司名称：AIPF检测助手有限公司\n
- 电子邮箱：fybfyb0801@qq.com\n
- 联系电话：19213080447\n\n
---\n\n
**感谢您信任并使用痘痘诊疗 App！**\n\n
AIPF检测助手有限公司\n
2025 年 3 月 5 日
        `;
    }

    uni.showModal({
        title: title,
        content: content,
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007AFF'
    });
};

onMounted(() => {
	// 初始提示
	tipMessage.value = isRegistering.value ? '请使用手机号注册，密码至少6位' : ''
})
</script>

<style lang="scss" scoped>
.login-container {
	min-height: 100vh;
	background: #FFFFFF;
	padding: 0 40rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.logo-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 0 80rpx;

	.logo {
		width: 180rpx;
		height: 180rpx;
		margin-bottom: 24rpx;
	}

	.app-name {
		font-size: 44rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}

	.slogan {
		font-size: 28rpx;
		color: #999999;
	}
}

.form-section {
	margin-bottom: 60rpx;

	.input-group {
		margin-bottom: 24rpx;
	}

	.input-item {
		display: flex;
		align-items: center;
		height: 100rpx;
		border-bottom: 1rpx solid #EEEEEE;
		margin-bottom: 20rpx;

		u-icon {
			margin-right: 20rpx;
		}

		input {
			flex: 1;
			height: 100%;
			font-size: 32rpx;
			color: #333333;
		}
	}

	.password-strength {
		display: flex;
		align-items: center;
		margin-top: 16rpx;

		.strength-label {
			font-size: 24rpx;
			color: #666666;
			margin-right: 16rpx;
		}

		.strength-bars {
			display: flex;
			gap: 8rpx;
			margin-right: 16rpx;

			.bar {
				width: 40rpx;
				height: 8rpx;
				background: #EEEEEE;
				border-radius: 4rpx;

				&.active {
					&:nth-child(1) {
						background: #FF6B6B;
					}

					&:nth-child(2) {
						background: #FFCC00;
					}

					&:nth-child(3) {
						background: #4CD964;
					}
				}
			}
		}

		.strength-text {
			font-size: 24rpx;

			&.weak {
				color: #FF6B6B;
			}

			&.medium {
				color: #FFCC00;
			}

			&.strong {
				color: #4CD964;
			}
		}
	}

	.error-message {
		display: flex;
		align-items: center;
		padding: 16rpx 0;

		u-icon {
			margin-right: 8rpx;
		}

		text {
			font-size: 24rpx;
			color: #FF6B6B;
		}
	}

	.tip-message {
		display: flex;
		align-items: center;
		padding: 16rpx 0;

		u-icon {
			margin-right: 8rpx;
		}

		text {
			font-size: 24rpx;
			color: #4CD964;
		}
	}
}

.button-group {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	margin-bottom: 40rpx;

	button {
		width: 100%;
		height: 96rpx;
		border-radius: 48rpx;
		font-size: 32rpx;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;

		&::after {
			border: none;
		}

		&:disabled {
			opacity: 0.7;
		}
	}

	.login-btn {
		background: #007AFF;
		color: #FFFFFF;
		box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);

		&:active {
			background: #0062CC;
		}
	}

	.register-btn {
		background: #F5F5F7;
		color: #333333;

		&:active {
			background: #E5E5EA;
		}
	}
}

.footer-info {
	margin-top: auto;
	padding: 40rpx 0;
	text-align: center;
	font-size: 24rpx;
	color: #999999;

	.link {
		color: #007AFF;
		margin: 0 4rpx;
	}
}

.success-popup {
	width: 600rpx;
	padding: 48rpx;
	background: #FFFFFF;
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;

	.success-title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
		margin: 24rpx 0 16rpx;
	}

	.success-message {
		font-size: 28rpx;
		color: #666666;
		text-align: center;
		margin-bottom: 32rpx;
	}

	.success-btn {
		width: 100%;
		height: 88rpx;
		background: #007AFF;
		color: #FFFFFF;
		border-radius: 44rpx;
		font-size: 32rpx;
		display: flex;
		align-items: center;
		justify-content: center;

		&::after {
			border: none;
		}
	}
}
</style>