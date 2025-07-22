interface StatsCardsProps {
  stats: any;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 animate-pulse">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Guard Dogs",
      value: stats.dogs.active,
      total: stats.dogs.total,
      icon: "🐕",
      color: "blue",
      status: `${stats.dogs.active} Active`,
      trend: stats.dogs.active > stats.dogs.total / 2 ? "up" : "down",
      change: `${Math.round((stats.dogs.active / stats.dogs.total) * 100)}%`,
    },
    {
      title: "Bodyguards",
      value: stats.guards.onDuty,
      total: stats.guards.total,
      icon: "👮",
      color: "green",
      status: `${stats.guards.onDuty} On Duty`,
      trend: stats.guards.onDuty > stats.guards.total / 2 ? "up" : "down",
      change: `${Math.round((stats.guards.onDuty / stats.guards.total) * 100)}%`,
    },
    {
      title: "CCTV Cameras",
      value: stats.cameras.online,
      total: stats.cameras.total,
      icon: "📹",
      color: "purple",
      status: `${stats.cameras.online} Online`,
      trend: stats.cameras.online > stats.cameras.total * 0.8 ? "up" : "down",
      change: `${Math.round((stats.cameras.online / stats.cameras.total) * 100)}%`,
    },
    {
      title: "Active Alerts",
      value: stats.events.critical,
      total: stats.events.total,
      icon: "🚨",
      color: "red",
      status: `${stats.events.pending} Pending`,
      trend: stats.events.critical === 0 ? "up" : "down",
      change: stats.events.critical === 0 ? "All Clear" : `${stats.events.critical} Critical`,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
      red: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? "📈" : "📉";
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.title}</p>
              <div className="flex items-baseline space-x-1 sm:space-x-2 mt-1 sm:mt-2">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                <span className="text-sm sm:text-base lg:text-lg text-gray-500">/{card.total}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-3 space-y-1 sm:space-y-0">
                <p className={`text-xs px-2 py-1 rounded-full inline-block ${getColorClasses(card.color)} truncate`}>
                  {card.status}
                </p>
                <div className={`flex items-center space-x-1 text-xs ${getTrendColor(card.trend)}`}>
                  <span>{getTrendIcon(card.trend)}</span>
                  <span className="truncate">{card.change}</span>
                </div>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl ml-2 sm:ml-4 flex-shrink-0">{card.icon}</div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  card.color === "blue" ? "bg-blue-500" :
                  card.color === "green" ? "bg-green-500" :
                  card.color === "purple" ? "bg-purple-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${Math.min((card.value / card.total) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>{card.total}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
