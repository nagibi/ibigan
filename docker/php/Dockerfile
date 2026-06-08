FROM php:8.4-fpm

ARG USER_ID=1000
ARG GROUP_ID=1000
ARG INSTALL_XDEBUG=0

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl unzip libpng-dev libjpeg-dev libwebp-dev libfreetype6-dev \
    libonig-dev libxml2-dev libzip-dev libpq-dev libicu-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd \
        --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl opcache sockets

RUN pecl install redis && docker-php-ext-enable redis

RUN if [ "$INSTALL_XDEBUG" = "1" ]; then \
        pecl install xdebug \
        && docker-php-ext-enable xdebug \
        && echo "xdebug.mode=debug" >> /usr/local/etc/php/conf.d/xdebug.ini \
        && echo "xdebug.client_host=host.docker.internal" >> /usr/local/etc/php/conf.d/xdebug.ini \
        && echo "xdebug.client_port=9003" >> /usr/local/etc/php/conf.d/xdebug.ini \
        && echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/xdebug.ini; \
    fi

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN usermod -u ${USER_ID} www-data && groupmod -g ${GROUP_ID} www-data

WORKDIR /var/www

USER www-data
