'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default function Home() {
  const [data, setData] = useState({})
  const [controls, setControls] = useState({})

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const { data: sensor } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
      
      const { data: ctrl } = await supabase
        .from('controls')
        .select('*')
        .eq('id', 1)
      
      if (sensor?.[0]) setData(sensor[0])
      if (ctrl?.[0]) setControls(ctrl[0])
    } catch (error) {
      console.error('Ошибка данных:', error)
    }
  }

  const updateControl = async (field, value) => {
    try {
      await supabase.from('controls').upsert({ id: 1, [field]: value })
    } catch (error) {
      console.error('Ошибка управления:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🏠 Умный дом</h1>
        
        {/* Датчики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-white">🌡️ {data.temperature?.toFixed(1) || '--'}°C</div>
            <div className="text-white/80 mt-1">Температура</div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-white">💧 {data.humidity?.toFixed(1) || '--'}%</div>
            <div className="text-white/80 mt-1">Влажность</div>
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-white">☀️ {data.light || '--'}</div>
            <div className="text-white/80 mt-1">Освещённость</div>
          </div>
        </div>

        {/* Лента + Таймер */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">🏠 Лента</h3>
            <button 
              className={`w-full p-4 rounded-xl text-xl font-bold transition-all ${controls.strip ? 'bg-green-500 hover:bg-green-600 shadow-lg' : 'bg-gray-500 hover:bg-gray-600'} text-white mb-4`}
              onClick={() => updateControl('strip', !controls.strip)}
            >
              {controls.strip ? '✅ ВКЛ (таймер)' : '❌ ВЫКЛ'}
            </button>
            <div className="text-white/80 mb-4 text-lg">
              ⏰ Таймер: {controls.timer_hours || 0}:{(controls.timer_minutes || 30).toString().padStart(2, '0')}
            </div>
            <div className="flex gap-3">
              <input 
                type="number" min="0" max="23" 
                value={controls.timer_hours || 0}
                onChange={(e) => updateControl('timer_hours', parseInt(e.target.value) || 0)}
                className="flex-1 p-3 rounded-xl bg-white/30 text-white text-lg font-bold text-center focus:outline-none focus:ring-4 focus:ring-blue-500"
                placeholder="Ч"
              />
              <span className="text-white/80 text-lg self-center">:</span>
              <input 
                type="number" min="0" max="59" 
                value={controls.timer_minutes || 30}
                onChange={(e) => updateControl('timer_minutes', parseInt(e.target.value) || 30)}
                className="flex-1 p-3 rounded-xl bg-white/30 text-white text-lg font-bold text-center focus:outline-none focus:ring-4 focus:ring-blue-500"
                placeholder="Мин"
              />
            </div>
          </div>

          {/* LED */}
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">💡 Светодиоды</h3>
            {['led1', 'led2', 'led3'].map(led => (
              <div key={led} className="space-y-2">
                <label className="block text-white/80 font-medium capitalize">{led}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" max="255" 
                    value={controls[led] || 0}
                    onChange={(e) => updateControl(led, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-yellow-400 hover:accent-yellow-300"
                  />
                  <span className="text-white/80 font-mono px-3 py-1 bg-white/10 rounded-lg min-w-[3rem] text-center">
                    {controls[led] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RGB + Зуммер */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">🌈 RGB</h3>
            {['rgb_r', 'rgb_g', 'rgb_b'].map(color => (
              <div key={color} className="space-y-2">
                <label className="block text-white/80 font-medium capitalize">{color.replace('rgb_', '')}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" max="255" 
                    value={controls[color] || 0}
                    onChange={(e) => updateControl(color, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:accent-purple-300"
                  />
                  <span className="text-white/80 font-mono px-3 py-1 bg-white/10 rounded-lg min-w-[3rem] text-center">
                    {controls[color] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6">🔊 Зуммер</h3>
            <button 
              className={`w-full p-6 rounded-2xl text-2xl font-bold transition-all ${controls.buzzer ? 'bg-red-500 hover:bg-red-600 shadow-lg' : 'bg-gray-500 hover:bg-gray-600'} text-white`}
              onClick={() => updateControl('buzzer', !controls.buzzer)}
            >
              {controls.buzzer ? '🔇 ВЫКЛЮЧИТЬ' : '🔊 ВКЛЮЧИТЬ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
