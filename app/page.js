'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default function Home() {
  const [data, setData] = useState({})
  const [controls, setControls] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  // Отдельные функции для fetch с обработкой ошибок
  const fetchSensorData = useCallback(async () => {
    try {
      const { data: sensor, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      return sensor || {}
    } catch (err) {
      console.error('Sensor fetch error:', err)
      return {}
    }
  }, [])

  const fetchControls = useCallback(async () => {
    try {
      const { data: ctrl, error } = await supabase
        .from('controls')
        .select('*')
        .eq('id', 1)
        .single()
      
      if (error) throw error
      return ctrl || {}
    } catch (err) {
      console.error('Controls fetch error:', err)
      return {}
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [sensorData, controlData] = await Promise.all([
      fetchSensorData(),
      fetchControls()
    ])
    
    setData(sensorData)
    setControls(controlData)
    setLoading(false)
  }, [fetchSensorData, fetchControls])

  const updateControl = useCallback(async (field, value) => {
    try {
      const updates = { id: 1, [field]: value, updated_at: new Date().toISOString() }
      const { error } = await supabase
        .from('controls')
        .upsert(updates, { onConflict: 'id' })
      
      if (error) throw error
      
      // Оптимистично обновляем UI
      setControls(prev => ({ ...prev, [field]: value }))
    } catch (err) {
      console.error('Update error:', err)
      setError('Ошибка обновления')
      setTimeout(() => setError(null), 3000)
    }
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, 2000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData])

  // Таймер форматирование
  const timerHours = controls.timer_hours ?? 0
  const timerMinutes = controls.timer_minutes ?? 30

  if (loading && !data.temperature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🏠 Умный дом</h1>
        
        {error && (
          <div className="bg-red-500/80 text-white p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}
        
        {/* Датчики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl text-center">
            <div className="text-3xl mb-2">
              🌡️ {data.temperature?.toFixed(1) ?? '--'}°C
            </div>
            <div className="text-white/80 text-lg">Температура</div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl text-center">
            <div className="text-3xl mb-2">
              💧 {data.humidity?.toFixed(1) ?? '--'}%
            </div>
            <div className="text-white/80 text-lg">Влажность</div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl text-center">
            <div className="text-3xl mb-2">
              ☀️ {data.light ?? '--'} лк
            </div>
            <div className="text-white/80 text-lg">Освещённость</div>
          </div>
        </div>

        {/* Управление */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Лента + Таймер */}
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">🏠 Лента</h3>
            <button 
              className={`w-full p-4 rounded-xl text-xl font-bold transition-all duration-200 ${
                controls.strip ? 'bg-green-500 hover:bg-green-600 shadow-lg' : 'bg-gray-500 hover:bg-gray-600'
              } text-white mb-6`}
              onClick={() => updateControl('strip', !controls.strip)}
            >
              {controls.strip ? '✅ ВКЛ' : '❌ ВЫКЛ'}
            </button>
            <div className="text-white/80 mb-4 text-lg">
              ⏰ Таймер: {timerHours}:{timerMinutes.toString().padStart(2, '0')}
            </div>
            <div className="flex gap-3">
              <input 
                type="number" 
                min="0" 
                max="23" 
                value={timerHours}
                onChange={(e) => updateControl('timer_hours', Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                className="flex-1 p-3 rounded-xl bg-white/30 text-white text-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="Ч"
              />
              <input 
                type="number" 
                min="0" 
                max="59" 
                value={timerMinutes}
                onChange={(e) => updateControl('timer_minutes', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="flex-1 p-3 rounded-xl bg-white/30 text-white text-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="Мин"
              />
            </div>
          </div>

          {/* LED */}
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">💡 Светодиоды</h3>
            {['led1', 'led2', 'led3'].map(led => (
              <div key={led} className="mb-6 last:mb-0">
                <label className="block text-white/90 mb-2 font-medium capitalize">{led}</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="255" 
                    value={controls[led] ?? 0}
                    onChange={(e) => updateControl(led, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-yellow-400 hover:accent-yellow-300 transition-all"
                  />
                  <span className="text-white/90 font-mono min-w-[3rem] text-right">
                    {controls[led] ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RGB + Зуммер */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">🌈 RGB</h3>
            {['rgb_r', 'rgb_g', 'rgb_b'].map((color, i) => (
              <div key={color} className="mb-6 last:mb-0">
                <label className="block text-white/90 mb-2 font-medium capitalize">{color.replace('rgb_', '')}</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="255" 
                    value={controls[color] ?? 0}
                    onChange={(e) => updateControl(color, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:accent-purple-300 transition-all"
                  />
                  <span className="text-white/90 font-mono min-w-[3rem] text-right">
                    {controls[color] ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">🔊 Зуммер</h3>
            <button 
              className={`w-full p-4 rounded-xl text-xl font-bold transition-all duration-200 ${
                controls.buzzer ? 'bg-red-500 hover:bg-red-600 shadow-lg' : 'bg-gray-500 hover:bg-gray-600'
              } text-white`}
              onClick={() => updateControl('buzzer', !controls.buzzer)}
            >
              {controls.buzzer ? '🔇 ВЫКЛ' : '🔊 ВКЛ'}
            </button>
          </div>
        </div>

        {/* Статус обновления */}
        <div className="mt-8 text-center text-white/60 text-sm">
          Последнее обновление: {new Date().toLocaleTimeString('ru-RU')}
        </div>
      </div>
    </div>
  )
}
