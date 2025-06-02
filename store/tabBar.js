import { defineStore } from 'pinia'

export const useTabBarStore = defineStore('tabBar', {
    state: () => ({
        currentPath: '',
        userRole: ''
    }),
    actions: {
        setCurrentPath(path) {
            this.currentPath = path
        },
        setUserRole(role) {
            this.userRole = role
            uni.setStorageSync('userRole', role)
        },
        getCurrentRole() {
            if (!this.userRole) {
                this.userRole = uni.getStorageSync('userRole') || 'patient'
            }
            return this.userRole
        }
    }
})