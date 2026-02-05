import React from 'react';
import { SimulationState } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EnergyChartsProps {
  simulationState: SimulationState;
  trackEnergyProfile: any[]; // Array of { distance, ke, pe, te }
}

const EnergyCharts: React.FC<EnergyChartsProps> = ({ simulationState, trackEnergyProfile }) => {
  
  const maxEnergy = Math.max(100, simulationState.totalEnergy * 1.2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Real-time Bars */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center h-full">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Current Energy State</h3>
            
            <div className="space-y-6">
                {/* Total Energy */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-400 font-bold">Total Energy (TE)</span>
                        <span className="font-mono text-slate-300">{simulationState.totalEnergy.toFixed(0)} J</span>
                    </div>
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min((simulationState.totalEnergy / maxEnergy) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Potential Energy */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-400 font-bold">Potential Energy (PE)</span>
                        <span className="font-mono text-slate-300">{simulationState.potentialEnergy.toFixed(0)} J</span>
                    </div>
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${Math.min((simulationState.potentialEnergy / maxEnergy) * 100, 100)}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">m • g • h = {simulationState.mass} • 10 • {simulationState.height.toFixed(1)}</div>
                </div>

                {/* Kinetic Energy */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-orange-400 font-bold">Kinetic Energy (KE)</span>
                        <span className="font-mono text-slate-300">{simulationState.kineticEnergy.toFixed(0)} J</span>
                    </div>
                    <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-orange-500"
                            style={{ width: `${Math.min((simulationState.kineticEnergy / maxEnergy) * 100, 100)}%` }}
                        />
                    </div>
                     <div className="text-[10px] text-slate-500 mt-1 font-mono">½ • m • v² = 0.5 • {simulationState.mass} • {simulationState.velocity.toFixed(1)}²</div>
                </div>
            </div>
            
            <div className="mt-auto pt-4 flex justify-between items-center bg-slate-900/50 p-3 rounded-lg">
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase">Velocity</div>
                    <div className="text-2xl font-mono text-white">{simulationState.velocity.toFixed(1)} <span className="text-sm text-slate-500">m/s</span></div>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase">Height</div>
                    <div className="text-2xl font-mono text-white">{simulationState.height.toFixed(1)} <span className="text-sm text-slate-500">m</span></div>
                </div>
            </div>
        </div>

        {/* Track Profile Chart */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col h-full">
             <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Track Energy Profile</h3>
             <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trackEnergyProfile} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPe" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorKe" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="distance" hide />
                        <YAxis stroke="#94a3b8" fontSize={10} width={30} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Area type="monotone" dataKey="pe" stackId="1" stroke="#3b82f6" fill="url(#colorPe)" name="Potential E" />
                        <Area type="monotone" dataKey="ke" stackId="1" stroke="#f97316" fill="url(#colorKe)" name="Kinetic E" />
                        <ReferenceLine 
                            x={simulationState.distance} 
                            stroke="white" 
                            strokeDasharray="3 3"
                            label={{ position: 'top', value: 'CART', fill: 'white', fontSize: 10 }} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
             <div className="text-center text-xs text-slate-500 mt-2">Position along track</div>
        </div>
    </div>
  );
};

export default EnergyCharts;