import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
})

export const uploadCSV = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const startTraining = (filename, targetCol) =>
    api.post('/train', { filename, target_col: targetCol })

export const getResults = (taskId) =>
    api.get(`/results/${taskId}`)

export default api
