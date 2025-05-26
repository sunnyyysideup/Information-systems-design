# Information-systems-design
Репозиторий с выполненными лабораторными работами по дисциплине "Проектирование информационных систем"

# Лабораторная работа 1 - развертывание сервиса с использованием minicube

В ходе лабораторной работы были освоены основы работы с Kubernetes: развернут кластер с использованием Minikube, создан и загружен Docker-образ пользовательского приложения, настроен Deployment с масштабированием количества подов, установлен и настроен Metrics Server, реализовано автоматическое масштабирование подов с помощью Horizontal Pod Autoscaler, а также развернут стек мониторинга на базе Prometheus и Grafana с настройкой дашборда для визуализации метрик нагрузки.

## Minikube
### 1. Установка:
* Скачать Minikube можно с официального репозитория:
https://github.com/kubernetes/minikube/releases
* Распаковать архив и поместить файл minikube.exe в папку, указанную в переменной среды PATH (например, C:\Program Files\Minikube\)
* Проверить установку:
```bash
minikube version
```

### 2. Запуск
Стандратный запуск по умолчанию используемых драйвера Hyper-V или Docker, в зависимости от вашей системы:
```bash
minikube start
```
Но нам нужно укащать драйвер вручную, возьмём Docker:
```bash
minikube start --driver=docker
```

## Создание Docker-образа приложения
Предположим, у нас есть простое Node.js-приложение (или Python/Flask и т.п.)
```bash
FROM python:3.9
WORKDIR /app
COPY app.py .
RUN pip install flask
CMD ["python", "app.py"]
```

## Создаём app.py
```bash
from flask import Flask, request, render_template_string
app = Flask(__name__)
items = []

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        item = request.form['item']
        items.append(item)
    return render_template_string("""
        <h1>Список "Хочу посмотреть/прочитать"</h1>
        <form method="POST">
            <input name="item">
            <button type="submit">Добавить</button>
        </form>
        <ul>
            {% for i in items %}
                <li>{{ i }}</li>
            {% endfor %}
        </ul>
    """, items=items)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## Создание Deployment
Файл deployment.yaml:
```bash
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app
        ports:
        - containerPort: 5000
```

Применить манифест:
```bash
kubectl apply -f deployment.yaml
```
## Установить количество подов = 3
В файле deployment.yaml уже задано через:
```bash
replicas: 3
```
Проверка:
```bash
kubectl get pods
```

## Metrics Server
Добавим его:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```
Проверка:
```bash
kubectl get deployment metrics-server -n kube-system
```
## Horizontal Pod Autoscaler (HPA)
Настройка:
```bash
kubectl autoscale deployment my-app --cpu-percent=50 --min=2 --max=5
```
Проверка:
```bash
kubectl get hpa
```

## Prometheus и Grafana
### Установка
#### Установка Helm:
Есть два способа:
1.Установка через Chocolatey (если установлен)
Helm можно установить через Chocolatey, однако он требует регистрации на сайте, и его нужно тоже устанавливать.
Если установлен Chocolatey (менеджер пакетов для Windows):
```bash
choco install kubernetes-helm
```
После установки перезапустить терминал и проверить:
```bash
helm version
```

2.Установка вручную
Если Chocolatey не установлен, можно установить Helm вручную:
  Шаг 1: Перейдите на официальный сайт загрузки Helm:
```bash
https://github.com/helm/helm/releases
```
  Шаг 2: Найдите последнюю версию (например, v3.14.0) и скачайте helm-v3.14.0-windows-amd64.zip.
  Шаг 3: Распакуйте архив.
  Шаг 4: Скопируйте файл helm.exe в любую папку, которая указана в переменной среды PATH. Например:
C:\Program Files\Helm\ или C:\Users\ВашеИмяПользователя\AppData\Local\Programs\Helm\

Проверьте установку в новом окне терминала:
```bash
helm version
```
#### После установки:
Добавление репозитория c чартами:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```
Установка kube-prometheus-stack:
```bash
helm install prometheus prometheus-community/kube-prometheus-stack
```
Это развернёт:
- Prometheus
- Grafana
- Node Exporter
- Kube State Metrics и другие компоненты

### Доступ к Grafana
Находим Grafana-сервис:
```bash
kubectl get svc
```
Или сразу порт-проксируем:
```bash
kubectl port-forward svc/prometheus-grafana 3000:80
```
Теперь в браузере открываем:
```bash
http://localhost:3000
```
Вводим указанные логин и пароль.

## Импорт дашборда
Шаг 1: В Grafana перейдите в Dashboards → New → Import.
Шаг 2: Вставьте ID, например: ID: 315 (Kubernetes Cluster Monitoring).
Шаг 3: Нажмите Load, затем выберите источник данных Prometheus.

# Лабораторная работа 2 - разработка микросервисной архитектуры с GraphQL
В ходе лабораторной работы было выполнено:
- Разработана микросервисная архитектура с 4-я сервисами: Users, Watchlist, Items, Gateway.
- Настроен GraphQL Gateway с использованием Apollo Federation.
- Реализованы CRUD-операции во всех микросервисах.
- Создан frontend на React с Apollo Client для работы с единой GraphQL API.
- Настроено взаимодействие между сервисами и клиентом через Gateway.
- Подготовлены репозиторий с инструкцией и видео с демонстрацией работы.

## Архитектура проекта:
### Frontend
- React + Apollo Client
- UI для управления списками фильмов, книг, сериалов и т.д.
### API Gateway
- Apollo Gateway
- Объединяет схемы микросервисов, маршрутизирует запросы
### Микросервисы (3-4)
#### 1. Users Service
- Хранит информацию о пользователях
- PostgreSQL
#### 2. Watchlist Service
- Списки “Хочу посмотреть/прочитать”
- Типы: фильмы, книги, сериалы
- CRUD: добавление/удаление/обновление/получение списка
- MongoDB
#### 3. Items Service
- Каталог фильмов, книг, сериалов (можно загрузить вручную или использовать mock-данные)
- PostgreSQL
#### 4. Recommendations Service (опционально)
- Рекомендации на основе предпочтений
- Можно реализовать простой алгоритм

## CRUD-функции
| Сервис        | Описание операций                          |
| ------------- | ------------------------------------------ |
| **Users**     | Регистрация, вход, получение профиля       |
| **Watchlist** | Добавить/удалить/обновить элемент списка   |
| **Items**     | Просмотр списка фильмов/книг/сериалов      |
| **Gateway**   | Объединение всех схем в одну точку доступа |

## Инструкция
### 1. Установка зависимостей
```bash
cd users-service && npm install
cd ../watchlist-service && npm install
cd ../items-service && npm install
cd ../gateway && npm install
cd ../frontend && npm install
```
### 2. Настройка .env файлов
Создаём .env файл в каждом микросервисе с переменными окружения.
#### users-service/.env
```bash
PORT=4001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usersdb
DB_USER=postgres
DB_PASS=your_password
```
#### watchlist-service/.env
```bash
PORT=4002
MONGO_URI=mongodb://localhost:27017/watchlistdb
```
#### items-service/.env
```bash
PORT=4003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=itemsdb
DB_USER=postgres
DB_PASS=your_password
```
#### gateway/.env
```bash
PORT=4000
```
### 3. Запуск отдельных микросервисов
Убеждаемся, что PostgreSQL и MongoDB работают.
Затем в каждой папке микросервиса выполняем:
```bash
npm start
```
### 4. Запуск Gateway
```bash
cd gateway
npm start
```
Должно появиться сообщение:
```bash
Gateway ready at http://localhost:4000/
```

### 5. Запуск Frontend
```bash
cd frontend
npm start
```

### 6. GraphQL-запросы
#### Получить список пользователей
```bash
query {
  users {
    id
    name
    email
  }
}
```
#### Получить watchlist пользователя
```bash
query {
  watchlist(userId: "1") {
    id
    type
    itemId
  }
}
```
#### Добавить элемент в список
```bash
mutation {
  addToWatchlist(userId: "1", itemId: "5", type: "movie") {
    id
    type
    itemId
  }
}
```
#### Получить все элементы (каталог)
```bash
query {
  items {
    id
    title
    genre
    type
  }
}
```

# Лабораторная работа 3 - разработка простого приложения для работы с большими данными

В ходе лабораторной работы было разработано веб-приложение на Flask, позволяющее:
- Загружать CSV-файлы;
- Выбирать целевую переменную и признаки;
- Строить корреляционную матрицу;
- Обучать модель линейной регрессии с регуляризацией Ridge;
- Отображать метрики RMSE и R², коэффициенты модели;
- Визуализировать результаты предсказаний.

## Запуск приложения

### 1. Клонирование репозитория
```bash
git clone https://github.com/sunnyyysideup/Information-systems-design.git
cd /Lab3_bigdata_app
```

### 2. Сборка и запуск контейнера
```bash
docker-compose up -d --build
```

Приложение будет доступно по адресу: **http://localhost:5000**

## Инструкция по использованию
1. Загрузка данных:
   - Откройте главную страницу;
   - Загрузите CSV-файл с числовыми данными.

2. Выбор признаков:
   - Укажите целевую переменную (target);
   - Отметьте признаки (features);
   - Ознакомьтесь с корреляционной матрицей.

3. Обучение модели:
   - Нажмите "Обучить модель";
   - Просмотрите: RMSE (корень средней квадратичной ошибки), R² (коэффициент детерминации), коэффициенты модели, график сравнения фактических и предсказанных значений.
  
## Структура проекта
```bash
.
├── app.py                # Flask-приложение
├── Dockerfile            # Инструкция сборки Docker-образа
├── docker-compose.yml    # Описание сервиса для Compose
├── requirements.txt      # Зависимости Python
├── static/               # Статические файлы (графики и матрицы)
├── templates/            # HTML-шаблоны интерфейса
│   ├── upload.html
│   ├── choose_columns.html
│   └── result.html
└── uploads/              # Загрузки файлов (создаются при работе)
```

## Остановка приложения
```bash
docker-compose down
```
