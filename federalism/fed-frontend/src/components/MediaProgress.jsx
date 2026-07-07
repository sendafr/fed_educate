import { useEffect, useState } from 'react'
import axios from 'axios'

export default function MediaProgress({ taskId, uploadProgress }) {
  const [process, setProcess] = useState({ percent: 0, status: 'Queued' })

  useEffect(() => {
    if (!taskId) return; // wait for upload to finish

    const timer = setInterval(async () => {
      const res = await axios.get(`/api/media/progress/${taskId}/`)
      setProcess(res.data)
      if (res.data.percent >= 100) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [taskId])

  const percent = taskId ? process.percent : uploadProgress
  const status = taskId ? process.status : `Uploading... ${uploadProgress}%`

  if (percent === 0 && !taskId) return null

  return (
    <div className="p-4 my-4 border rounded-lg">
      <p className="text-sm mb-2">{status}</p>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div className="bg-blue-500 h-2 rounded transition-all" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  )
}