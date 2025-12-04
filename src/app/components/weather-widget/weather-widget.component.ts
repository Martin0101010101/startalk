import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, HttpClientModule, MatIconModule],
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.scss']
})
export class WeatherWidgetComponent implements OnInit {
  weather = signal<{ temp: number; code: number } | null>(null);
  loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchWeather();
  }

  fetchWeather() {
    // Grand Rapids, MI coordinates
    // Using Open-Meteo API (Free, no key required)
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=42.9634&longitude=-85.6681&current=temperature_2m,weather_code&temperature_unit=fahrenheit';

    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.weather.set({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch weather', err);
        this.loading.set(false);
      }
    });
  }

  getWeatherIcon(code: number): string {
    // WMO Weather interpretation codes
    if (code === 0) return 'wb_sunny';
    if (code >= 1 && code <= 3) return 'partly_cloudy_day';
    if (code >= 45 && code <= 48) return 'foggy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 71 && code <= 77) return 'ac_unit'; // Snow
    if (code >= 80 && code <= 82) return 'rainy';
    if (code >= 85 && code <= 86) return 'ac_unit'; // Snow showers
    if (code >= 95) return 'thunderstorm';
    return 'cloud';
  }

  getWeatherDesc(code: number): string {
      if (code === 0) return 'Clear';
      if (code >= 1 && code <= 3) return 'Partly Cloudy';
      if (code >= 45 && code <= 48) return 'Fog';
      if (code >= 51 && code <= 67) return 'Rain';
      if (code >= 71 && code <= 77) return 'Snow';
      if (code >= 80 && code <= 82) return 'Showers';
      if (code >= 85 && code <= 86) return 'Snow Showers';
      if (code >= 95) return 'Thunderstorm';
      return 'Cloudy';
  }
}
