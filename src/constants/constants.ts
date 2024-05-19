// constants.ts

export const aqiMapping: { [key: number]: string } = {
	1: 'Хорошо',
	2: 'Умеренно',
	3: 'Средне',
	4: 'Плохо',
	5: 'Очень плохо',
};
  
export const aqiColorMapping: { [key: number]: string } = {
	1: 'green',
	2: 'yellow',
	3: 'orange',
	4: 'red',
	5: 'darkred',
};
  
export const chartConfig = {
	height: 400,
	xField: 'address',
	yField: 'value',
	stack: 'true',
	colorField: 'parameter',
	axis: {
		x: { title: 'Адрес' },
		y: { title: 'Концентрация в мкг/куб.м' },
	},
	legend: {
		position: 'top',
	},
};