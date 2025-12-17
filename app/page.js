'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
//import { RgbColorPicker } from 'react-colorful'
import dynamic from 'next/dynamic'

const RgbColorPicker = dynamic(
  () => import('react-colorful').then(mod => ({ default: mod.RgbColorPicker })),
  { ssr: false, loading: () => <div className="h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl animate-pulse" /> }
)

export default function Home() {
  const [data, setData] = useState({})
  const [isClient, setIsClient] = useState(false)
  const [controls, setControls] = useState({
    led1: 0, led2: 0, led3: 0,
    rgb_r: 0, rgb_g: 0, rgb_b: 0,
    strip: false, buzzer: false,
    timer_hours: 0, timer_minutes: 30
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [rgbColor, setRgbColor] = useState({ r: 0, g: 0, b: 0 })

  //const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setIsClient(true)  // клиентский рендер
  }, [])

  
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

 // Синхронизируем rgbColor с controls из Supabase
  useEffect(() => {
    setRgbColor({
      r: controls.rgb_r || 0,
      g: controls.rgb_g || 0,
      b: controls.rgb_b || 0
    })
  }, [controls.rgb_r, controls.rgb_g, controls.rgb_b])
  
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
    const { error } = await supabase.from('controls').upsert(updates)
    if (error) {
    console.error('SUPABASE ERROR:', error)  
    return
  }
    //await supabase.from('controls').upsert(updates)
    setControls(prev => ({ ...prev, [field]: value }))
  }

  const updateRgbColor = (color) => {
    setRgbColor(color)
    // Автоматически обновляем все 3 значения в Supabase
    updateControl('rgb_r', color.r)
    updateControl('rgb_g', color.g)
    updateControl('rgb_b', color.b)
  }

  const renderTime = () => {
    if (!currentTime) return '00:00:00'
    return currentTime.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const renderDate = () => {
    if (!currentTime) return '---'
    return currentTime.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black text-center mb-12 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent drop-shadow-2xl">
          🏠 Умный дом
        </h1>
    <div className="text-center mb-8">
          <div className="text-2xl opacity-80 mb-1">
            {isClient ? currentTime.toLocaleDateString('ru-RU', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) : '---'}
          </div>
          <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
            {isClient ? currentTime.toLocaleTimeString('ru-RU', {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            }) : '00:00:00'}
          </div>
        </div>

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
            <label className="block text-lg font-semibold opacity-90 capitalize">
              {led === 'led1' ? '1 этаж' : led === 'led2' ? '2 этаж' : 'Гостиная'}
            </label>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 🌈 RGB ПАЛИТРА С ДИНАМИЧЕСКИМ ИМПОРТОМ */}
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              🌈 RGB Палитра
            </h3>
            
            {/* Предпросмотр цвета */}
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div 
                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl shadow-2xl border-4 border-white/30 hover:scale-105 transition-transform duration-200"
                style={{
                  backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`
                }}
              />
              <div className="text-lg opacity-90 font-mono bg-black/20 px-3 py-1 rounded-xl">
                rgb({rgbColor.r}, {rgbColor.g}, {rgbColor.b})
              </div>
            </div>
            
            {/* ✅ ДИНАМИЧЕСКАЯ ПАЛИТРА - работает на Vercel! */}
            {isClient && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/20">
                <RgbColorPicker 
                  color={rgbColor} 
                  onChange={updateRgbColor}
                />
              </div>
            )}
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
