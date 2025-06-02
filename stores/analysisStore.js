import { defineStore } from 'pinia'

export const useAnalysisStore = defineStore('analysis', {
    state: () => ({
        currentAnalysis: {
            image: '',
            analysis: '',
            disclaimer: ''
        }
    }),
    actions: {
        setAnalysis(data) {
            this.currentAnalysis = data
        },
        clearAnalysis() {
            this.currentAnalysis = {
                image: '',
                analysis: '',
                disclaimer: ''
            }
        }
    }
})