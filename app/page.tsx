'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default function Home() {
  const [data, setData] = useState({})
  const [controls, setControls] = useState({
    led1: 0, led2: 0, led3: 0,
    rgb_r: 0, rgb_g: 0, rgb_b: 0,
    strip: false, buzzer: false,
    timer_hours: 0, timer_minutes: 30
  })

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const { data: sensor } = await supabase
        .from('sensor_data').select('*')
        .order('created_at', { ascending: false }).limit(1)
      
      const { data: ctrl } = await supabase
        .from('controls').select('*').eq('id', 1)
      
      if (sensor?.[0]) setData(sensor[0])
      if (ctrl?.[0]) setControls(prev => ({ ...prev, ...ctrl[0] }))
    } catch (e) { console.error(e) }
  }

  const updateControl = async (field, value) => {
    const updates = { id: 1, [field]: value }
    await supabase.from('controls').upsert(updates)
    setControls(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black text-center mb-12 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent drop-shadow-2xl">
          🏠 Умный дом
        </h1>

        {/* Датчики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
            <div className="text-4xl font-black text-center mb-2">🌡️ {data.temperature?.toFixed(1) || '--'}</div>
            <div className="text-white/70 text-center text-lg font-medium">Температура</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
            <div className="text-4xl font-black text-center mb-2">💧 {data.humidity?.toFixed(1) || '--'}</div>
            <div className="text-white/70 text-center text-lg font-medium">Влажность</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
            <div className="text-4xl font-black text-center mb-2">☀️ {data.light || '--'}</div>
            <div className="text-white/70 text-center text-lg font-medium">Освещённость</div>
          </div>
        </div>

        {/* Управление */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Лента + Таймер */}
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              🏠 Лента
            </h3>
            <button 
              className={`w-full p-6 rounded-2xl text-xl font-black mb-6 transition-all duration-300 transform ${
                controls.strip 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-2xl shadow-emerald-500/50 hover:scale-105 hover:shadow-3xl' 
                  : 'bg-gray-700/50 hover:bg-gray-600/50 shadow-xl hover:shadow-2xl'
              }`}
              onClick={() => updateControl('strip', !controls.strip)}
            >
              {controls.strip ? '✅ ВКЛ (таймер активен)' : '❌ ВЫКЛ'}
            </button>
            
            <div className="text-lg opacity-90 mb-6">
              ⏰ Таймер: <span className="font-mono text-2xl font-black text-emerald-400">
                {controls.timer_hours}:{controls.timer_minutes?.toString().padStart(2,'0')}
              </span>
            </div>
            
            <div className="flex gap-4">
              <input 
                type="number" min="0" max="23" 
                value={controls.timer_hours || 0}
                onChange={e => updateControl('timer_hours', +e.target.value)}
                className="flex-1 p-4 rounded-2xl bg-white/20 border border-white/30 text-white text-xl font-bold text-center focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all"
                placeholder="Ч"
              />
              <div className="text-2xl font-black text-white/50 self-center">:</div>
              <input 
                type="number" min="0" max="59" 
                value={controls.timer_minutes || 30}
                onChange={e => updateControl('timer_minutes', +e.target.value)}
                className="flex-1 p-4 rounded-2xl bg-white/20 border border-white/30 text-white text-xl font-bold text-center focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all"
                placeholder="Мин"
              />
            </div>
          </div>

          {/* LED */}
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              💡 Светодиоды
            </h3>
            {['led1', 'led2', 'led3'].map(led => (
              <div key={led} className="space-y-3">
                <label className="block text-lg font-semibold opacity-90 capitalize">{led}</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" max="255" 
                    value={controls[led] || 0}
                    onChange={e => updateControl(led, +e.target.value)}
                    className="flex-1 h-3 bg-white/20 rounded-xl appearance-none cursor-pointer accent-yellow-400 hover:accent-yellow-300 shadow-inner"
                  />
                  <span className="w-16 text-center font-mono text-xl font-black bg-white/10 px-4 py-2 rounded-xl border border-yellow-500/30">
                    {controls[led] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RGB + Зуммер */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              🌈 RGB
            </h3>
            {['rgb_r', 'rgb_g', 'rgb_b'].map(color => (
              <div key={color} className="space-y-3">
                <label className="block text-lg font-semibold opacity-90 capitalize">
                  {color.replace('rgb_', '')}
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" max="255" 
                    value={controls[color] || 0}
                    onChange={e => updateControl(color, +e.target.value)}
                    className="flex-1 h-3 bg-white/20 rounded-xl appearance-none cursor-pointer accent-purple-400 hover:accent-purple-300 shadow-inner"
                  />
                  <span className="w-16 text-center font-mono text-xl font-black bg-white/10 px-4 py-2 rounded-xl border border-purple-500/30">
                    {controls[color] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-black bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent mb-8">
              🔊
            </h3>
            <button 
              className={`w-full p-8 rounded-3xl text-2xl font-black transition-all duration-300 transform ${
                controls.buzzer
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-2xl shadow-red-500/50 hover:scale-105 hover:shadow-3xl' 
                  : 'bg-gray-700/50 hover:bg-gray-600/50 shadow-xl hover:shadow-2xl'
              } text-white`}
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
