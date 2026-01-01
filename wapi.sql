-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 01, 2026 at 03:30 PM
-- Server version: 10.11.11-MariaDB-log
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `wapi`
--

-- --------------------------------------------------------

--
-- Table structure for table `deposit`
--

CREATE TABLE `deposit` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `no_invoice` varchar(20) NOT NULL,
  `username` varchar(20) NOT NULL,
  `provider` varchar(255) NOT NULL,
  `payment` varchar(255) NOT NULL,
  `system` enum('Otomatis','Manual') NOT NULL,
  `code_unik` int(11) DEFAULT NULL,
  `amount` int(11) NOT NULL,
  `get_saldo` int(11) NOT NULL,
  `note` varchar(255) NOT NULL,
  `rate` varchar(10) NOT NULL,
  `qrcode` text DEFAULT NULL,
  `status` enum('Paid','Unpaid','Error','Pending','Cancel') NOT NULL,
  `due_date` text DEFAULT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `merchant` varchar(20) NOT NULL,
  `platform` enum('Website','API') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deposit_method`
--

CREATE TABLE `deposit_method` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `provider` varchar(30) NOT NULL,
  `provider_id` int(11) NOT NULL,
  `payment` varchar(30) NOT NULL,
  `name_account` varchar(50) NOT NULL,
  `no_account` varchar(30) NOT NULL,
  `qrcode` text NOT NULL,
  `rate` varchar(10) NOT NULL,
  `note` varchar(100) NOT NULL,
  `min` varchar(20) NOT NULL,
  `max` varchar(20) NOT NULL,
  `type` enum('Bank','Emoney','Pulsa Transfer','Virtual Account','Qris','Convenience Store') NOT NULL,
  `status` enum('Active','Inactive') NOT NULL,
  `system` enum('Otomatis','Manual') NOT NULL,
  `img` varchar(20) NOT NULL,
  `merchant` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deposit_method`
--

INSERT INTO `deposit_method` (`id`, `provider`, `provider_id`, `payment`, `name_account`, `no_account`, `qrcode`, `rate`, `note`, `min`, `max`, `type`, `status`, `system`, `img`, `merchant`) VALUES
(1, 'BCA', 0, 'Bank Central Asia', 'Ulung Briansyah Putra', '2320513009', '-', '1', 'Dikonfirmasi Otomatis 1-10 Detik Setelah Transfer.', '10000', '10000000', 'Bank', 'Active', 'Manual', 'bca.png', 'MANUAL'),
(2, 'SeaBank', 0, 'SeaBank Indonesia', 'Ulung Briansyah Putra', '901055434130', '-', '1', 'Dikonfirmasi Otomatis 1-10 Detik Setelah Transfer.', '10000', '20000000', 'Bank', 'Active', 'Manual', 'seabank.png', 'MANUAL'),
(3, 'Mandiri', 0, 'Mandiri', 'Ulung Briansyah Putra', '1610012842196', '-', '1', 'Dikonfirmasi Otomatis 1-10 Detik Setelah Transfer.', '10000', '20000000', 'Bank', 'Active', 'Manual', 'mandiri.png', 'MANUAL'),
(4, 'DANA', 0, 'Dana Wallet #1', 'Ulung Briansyah Putra', '085186881840', '-', '1', 'Dikonfirmasi Otomatis 1-10 Detik Setelah Transfer.', '10000', '20000000', 'Emoney', 'Active', 'Manual', 'dana.png', 'MANUAL'),
(5, 'DANA', 0, 'Dana Wallet #2', 'Decky Mahendra', '085156451708', '-', '1', 'Dikonfirmasi Otomatis 1-10 Detik Setelah Transfer.', '10000', '20000000', 'Emoney', 'Inactive', 'Manual', 'dana.png', 'MANUAL'),
(6, 'Qris', 0, 'QRIS INSTANT', 'Ulung Briansyah Putra', '01', '00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801518707310211715187073150303UKE51440014ID.CO.QRIS.WWW0215ID10233026608250303UKE5204274153033605802ID5921Ulung Briansyah Putra6015Lombok Barat (K61058335562070703A016304780F', '0.93', 'Dikonfirmasi Otomatis 1-10 Detik Setelah Transfer.', '1000', '10000000', 'Qris', 'Active', 'Otomatis', 'qris.png', 'MANUAL'),
(7, 'Qris', 17, 'QRIS INSTANT 2', 'Razer Pedia Digital', '01', '00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801518707310211715187073150303UKE51440014ID.CO.QRIS.WWW0215ID10233026608250303UKE5204274153033605802ID5921Ulung Briansyah Putra6015Lombok Barat (K61058335562070703A016304780F', '0.90', 'Deposit Otomatis', '100', '10000000', 'Qris', 'Active', 'Otomatis', 'qris.png', 'PAYDISINI');

-- --------------------------------------------------------

--
-- Table structure for table `history_saldo`
--

CREATE TABLE `history_saldo` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(20) NOT NULL,
  `type` enum('Debit','Credit') NOT NULL,
  `quantity` int(11) NOT NULL,
  `saldo_before` int(11) NOT NULL,
  `saldo_after` int(11) NOT NULL,
  `msg` varchar(500) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  `type` enum('Login','Logout') NOT NULL,
  `ip_static` varchar(20) NOT NULL,
  `user_agent` varchar(255) NOT NULL,
  `device` varchar(255) NOT NULL,
  `browser` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  `latitude` varchar(255) NOT NULL,
  `longitude` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(20) NOT NULL,
  `duration` varchar(20) NOT NULL,
  `description` text NOT NULL,
  `price` int(11) NOT NULL,
  `status` enum('Available','Sold Out') NOT NULL,
  `type` enum('Basic','Bisnis','Trial','Custom') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `duration`, `description`, `price`, `status`, `type`) VALUES
(294, 'Bisnis', '365 Hari', '  ✅Unlimited Pesan<br>\n✅Kirim personal<br>\n✅Kirim group<br>\n✅Pesan text<br>\n❌Pesan Blast<br>\n❌Pesan schedule<br>\n❌Pesan template (deprecated)<br>\n❌Pesan button (deprecated)<br>\n❌Pesan attachment<br>\n❌Autoreply<br>\n❌Webhook<br>\n✅API<br>\n✅Full Support 24/7', 45000, 'Available', 'Basic'),
(295, 'Trial', '5 Hari', 'sddsdc', 1000, 'Available', 'Trial');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `username` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `balance` int(11) NOT NULL,
  `usage` int(11) NOT NULL,
  `level` enum('Developers','Admin','Premium','Basic') NOT NULL,
  `status` enum('Active','Suspend','Locked') NOT NULL,
  `code_verifikasi` varchar(6) NOT NULL,
  `status_api` enum('Active','Inactive') NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `ip_static` varchar(255) DEFAULT NULL,
  `uplink` varchar(255) NOT NULL,
  `register_at` datetime NOT NULL,
  `read_news` enum('true','false') NOT NULL,
  `random_token` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `email`, `phone`, `password`, `balance`, `usage`, `level`, `status`, `code_verifikasi`, `status_api`, `api_key`, `ip_static`, `uplink`, `register_at`, `read_news`, `random_token`, `remember_token`) VALUES
(1, 'Razer Pedia Digital', 'razped', 'razerpediaid@gmail.com', '6285156451708', '$2b$10$zZsC/SGBJIJIO5hHeDJLTeJRGAOsK2p3/4a8Khaz9botnHsnL6iB.', 299055, 48000, 'Developers', 'Active', '-', 'Inactive', '4827a7fe-7c31-4f05-a047-f9bfe93dd70f', '', 'Upby Sistem', '2025-07-12 20:41:02', 'false', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `wa_sessions`
--

CREATE TABLE `wa_sessions` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `wid` varchar(255) DEFAULT NULL,
  `pushname` varchar(255) DEFAULT NULL,
  `authData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`authData`)),
  `packageName` varchar(255) DEFAULT '',
  `packageDuration` varchar(11) DEFAULT '0',
  `packageExpired` date DEFAULT NULL,
  `packageStatus` enum('Active','Inactive','Expired') DEFAULT 'Active',
  `waStatus` enum('Connected','Disconnected','Logout') DEFAULT NULL,
  `botName` varchar(255) DEFAULT NULL,
  `botPhoneNumber` varchar(255) DEFAULT NULL,
  `personalWebhookUrl` varchar(255) DEFAULT '',
  `groupWebhookUrl` varchar(255) DEFAULT '',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_activity` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `auto_read` tinyint(1) DEFAULT 1,
  `typing_reply` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wa_sessions`
--

INSERT INTO `wa_sessions` (`id`, `username`, `wid`, `pushname`, `authData`, `packageName`, `packageDuration`, `packageExpired`, `packageStatus`, `waStatus`, `botName`, `botPhoneNumber`, `personalWebhookUrl`, `groupWebhookUrl`, `created_at`, `updated_at`, `last_activity`, `is_active`, `auto_read`, `typing_reply`) VALUES
(1, 'razped', '6285338410674:22@s.whatsapp.net', 'Razer pedia', '{\"noiseKey\":{\"private\":{\"type\":\"Buffer\",\"data\":[128,180,31,177,218,63,28,234,64,169,2,216,136,234,10,134,98,132,170,157,161,57,203,219,231,197,196,170,148,95,195,124]},\"public\":{\"type\":\"Buffer\",\"data\":[174,77,239,94,43,31,56,4,53,137,247,167,139,36,79,187,62,145,230,162,201,136,54,222,201,81,164,0,63,114,78,105]}},\"pairingEphemeralKeyPair\":{\"private\":{\"type\":\"Buffer\",\"data\":[200,173,17,201,151,10,141,10,82,235,16,67,76,195,240,127,39,109,171,210,200,58,85,31,11,67,250,106,46,21,193,71]},\"public\":{\"type\":\"Buffer\",\"data\":[138,157,225,27,245,118,207,68,220,226,76,65,114,218,134,209,214,139,247,18,55,62,167,22,201,3,47,10,209,83,155,69]}},\"signedIdentityKey\":{\"private\":{\"type\":\"Buffer\",\"data\":[208,184,22,200,77,45,219,253,225,69,3,55,167,176,18,73,209,8,142,12,145,96,231,68,226,122,3,58,202,162,132,114]},\"public\":{\"type\":\"Buffer\",\"data\":[64,149,93,123,54,246,33,215,108,208,26,66,185,201,195,150,255,137,137,223,92,18,147,191,157,157,193,52,29,116,49,102]}},\"signedPreKey\":{\"keyPair\":{\"private\":{\"type\":\"Buffer\",\"data\":[104,50,102,167,214,24,100,93,236,94,188,236,188,195,96,132,156,32,29,132,85,57,254,157,225,75,112,82,87,135,252,122]},\"public\":{\"type\":\"Buffer\",\"data\":[225,185,239,160,184,148,78,68,171,254,148,166,179,205,18,240,144,5,142,78,101,133,248,139,126,210,28,74,209,240,253,100]}},\"signature\":{\"type\":\"Buffer\",\"data\":[33,76,178,59,104,83,148,27,183,172,193,5,61,192,27,132,82,225,242,240,10,54,87,237,54,146,179,3,217,174,75,93,174,199,230,87,123,93,142,253,220,200,14,6,82,191,50,39,3,208,42,117,5,76,17,240,68,43,107,41,105,69,145,128]},\"keyId\":1},\"registrationId\":144,\"advSecretKey\":\"Fz34qeAnXvRNcxewjT5G8EUk9v23TUQ2c7EUUvPLDV4=\",\"processedHistoryMessages\":[{\"key\":{\"remoteJid\":\"6285338410674@s.whatsapp.net\",\"fromMe\":false,\"id\":\"A56ECB47CB33795E70537E977ACD0DD6\",\"participant\":\"\",\"addressingMode\":\"pn\"},\"messageTimestamp\":1767276804},{\"key\":{\"remoteJid\":\"6285338410674@s.whatsapp.net\",\"fromMe\":false,\"id\":\"A56739B490C2071FCB67D7FFC37A2761\",\"participant\":\"\",\"addressingMode\":\"pn\"},\"messageTimestamp\":1767276804},{\"key\":{\"remoteJid\":\"6285338410674@s.whatsapp.net\",\"fromMe\":false,\"id\":\"A5416848EAC6071F4D021AECF4F3D0F5\",\"participant\":\"\",\"addressingMode\":\"pn\"},\"messageTimestamp\":1767276804},{\"key\":{\"remoteJid\":\"6285338410674@s.whatsapp.net\",\"fromMe\":false,\"id\":\"A57B45562802B2908F4396973654C03E\",\"participant\":\"\",\"addressingMode\":\"pn\"},\"messageTimestamp\":1767276805},{\"key\":{\"remoteJid\":\"6285338410674@s.whatsapp.net\",\"fromMe\":false,\"id\":\"A5E26AC8875E16CFE630E3AF4F834312\",\"participant\":\"\",\"addressingMode\":\"pn\"},\"messageTimestamp\":1767276821},{\"key\":{\"remoteJid\":\"6285338410674@s.whatsapp.net\",\"fromMe\":false,\"id\":\"A59EF2B7D147B0FA69029B4FED46CE82\",\"participant\":\"\",\"addressingMode\":\"pn\"},\"messageTimestamp\":1767276848},{\"key\":{\"remoteJid\":\"6285338410674@s.whatsapp.net\",\"fromMe\":false,\"id\":\"A50B0B0F21900AAA53F969C72ECE43F7\",\"participant\":\"\",\"addressingMode\":\"pn\"},\"messageTimestamp\":1767276852}],\"nextPreKeyId\":815,\"firstUnuploadedPreKeyId\":815,\"accountSyncCounter\":1,\"accountSettings\":{\"unarchiveChats\":false},\"registered\":true,\"pairingCode\":\"Y5RCC5KN\",\"me\":{\"id\":\"6285338410674:22@s.whatsapp.net\",\"name\":\"Razer pedia\",\"lid\":\"103788488724489:22@lid\"},\"account\":{\"details\":\"CNHAppgHEPOB2soGGAEgACgA\",\"accountSignatureKey\":\"s1ERFvk7AB/nBX/x/lv6QX9uK1v4rcTbchQ9gPqxQxM=\",\"accountSignature\":\"F2hRmc/e3tfLq6FQLSL1QcB8zYB3JCTxWtD9ZXABuJ/On/Pp3xiB5T3/tuux80fm7E79E+jWwygxobDQuj8pDw==\",\"deviceSignature\":\"2PrdvP3xZGwcDfEuVmW5FtTJ/3xpk9H7FSf2PfOwVnLc0MPFr1cXbf9j+X2rojSncy45DkcDi39BHFOZYROgiQ==\"},\"signalIdentities\":[{\"identifier\":{\"name\":\"103788488724489:22@lid\",\"deviceId\":0},\"identifierKey\":{\"type\":\"Buffer\",\"data\":[5,179,81,17,22,249,59,0,31,231,5,127,241,254,91,250,65,127,110,43,91,248,173,196,219,114,20,61,128,250,177,67,19]}}],\"platform\":\"smba\",\"routingInfo\":{\"type\":\"Buffer\",\"data\":[8,5,8,8,8,13]},\"lastAccountSyncTimestamp\":1767276888,\"lastPropHash\":\"1K4hH4\",\"myAppStateKeyId\":\"AAAAAEeL\"}', 'Basic', '365', '2026-09-11', 'Active', 'Connected', 'RazpedBot', '6285338410674', 'https://bot.razped.com/sofxstore.php', 'https://bot.razped.com/sofxstore.php', '2025-09-11 21:46:51', '2026-01-01 22:51:36', NULL, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `web_setting`
--

CREATE TABLE `web_setting` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(20) NOT NULL,
  `owner` varchar(20) NOT NULL,
  `keyword` varchar(200) NOT NULL,
  `description` varchar(700) NOT NULL,
  `logo` varchar(100) NOT NULL,
  `thema` text NOT NULL,
  `alert` varchar(10) NOT NULL,
  `maintenance` enum('true','false') NOT NULL,
  `created_at` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `web_setting`
--

INSERT INTO `web_setting` (`id`, `title`, `owner`, `keyword`, `description`, `logo`, `thema`, `alert`, `maintenance`, `created_at`) VALUES
(1, 'RazpedWapi', 'UllungArt', 'asc', 'asc', 'https://www.razped.com/library/media/logos/svg_icon_circle.png', 'light', '1', 'false', '2025-03-21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `history_saldo`
--
ALTER TABLE `history_saldo`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_phone_unique` (`phone`);

--
-- Indexes for table `wa_sessions`
--
ALTER TABLE `wa_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_username` (`username`);

--
-- Indexes for table `web_setting`
--
ALTER TABLE `web_setting`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `history_saldo`
--
ALTER TABLE `history_saldo`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=296;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `wa_sessions`
--
ALTER TABLE `wa_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `web_setting`
--
ALTER TABLE `web_setting`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
