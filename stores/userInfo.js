import { defineStore } from 'pinia'
import { updatePatientInfo, getPatientInfo } from '@/api/user'

export const useUserInfoStore = defineStore('userInfo', {
    state: () => ({
        avatarUrl: '/static/images/default-avatar.png',
        name: '',
        gender: '男',
        age: '',
        phone: '',
        address: '',
        id_card: '',
        marital_status: '',
        ethnicity: '',
        residence: '',
        birth_date: ''
    }),

    actions: {
        updateUserInfo(userInfo) {
            // 更新本地状态
            this.avatarUrl = userInfo.avatarUrl || this.avatarUrl
            this.name = userInfo.name || this.name
            this.gender = userInfo.gender || this.gender
            this.age = userInfo.age || this.age
            this.phone = userInfo.phone || this.phone
            this.address = userInfo.address || this.address
            this.id_card = userInfo.id_card || this.id_card
            this.marital_status = userInfo.marital_status || this.marital_status
            this.ethnicity = userInfo.ethnicity || this.ethnicity
            this.residence = userInfo.residence || this.residence
            this.birth_date = userInfo.birth_date || this.birth_date

            // 保存到本地存储作为缓存
            uni.setStorageSync('userInfo', {
                avatarUrl: this.avatarUrl,
                name: this.name,
                gender: this.gender,
                age: this.age,
                phone: this.phone,
                address: this.address,
                id_card: this.id_card,
                marital_status: this.marital_status,
                ethnicity: this.ethnicity,
                residence: this.residence,
                birth_date: this.birth_date
            })
        },

        // 从后端获取用户信息
        async fetchUserInfo() {
            try {
                // 尝试从后端获取
                const response = await getPatientInfo()
                if (response && response.data) {
                    this.updateUserInfo(response.data)
                    return response.data
                }

                // 如果后端没有数据，尝试从本地存储获取
                const cachedInfo = uni.getStorageSync('userInfo')
                if (cachedInfo) {
                    this.updateUserInfo(cachedInfo)
                    return cachedInfo
                }

                return null
            } catch (error) {
                console.error('获取用户信息失败:', error)

                // 如果API调用失败，尝试从本地存储获取
                const cachedInfo = uni.getStorageSync('userInfo')
                if (cachedInfo) {
                    this.updateUserInfo(cachedInfo)
                    return cachedInfo
                }

                return null
            }
        },

        // 保存信息到后端
        async saveToBackend(userInfo) {
            try {
                // 更新本地状态
                this.updateUserInfo(userInfo)

                // 准备发送到后端的数据
                const patientInfo = {
                    name: this.name,
                    age: String(this.age), // 确保年龄是字符串类型
                    gender: this.gender, // 已经是中文性别了
                    id_card: this.id_card || '',
                    marital_status: this.marital_status || '',
                    ethnicity: this.ethnicity || '',
                    residence: this.address || this.residence || '', // 使用address作为residence的备选
                    birth_date: this.birth_date || ''
                }

                // 发送到后端
                const response = await updatePatientInfo(patientInfo)
                return response
            } catch (error) {
                console.error('保存用户信息失败:', error)
                throw error
            }
        }
    }
})