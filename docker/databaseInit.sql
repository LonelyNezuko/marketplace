create database if not exists `iboot` character set utf8 collate utf8_general_ci;

-- create user and grant
create user if not exists 'iboot'@'%' identified by '9P9Z3Mx5wrAwC684D1Unc46zq4Uu0Chv';
grant all privileges on `iboot`.* to 'iboot'@'%';