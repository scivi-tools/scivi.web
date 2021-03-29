#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# import time
# import random
# import math


# if not "Words" in CACHE:
#     sh = SETTINGS_VAL["Words"].split("\n")
#     random.shuffle(sh)
#     CACHE["Words"] = sh
#     CACHE["Index"] = 0;
#     CACHE["Word"] = None
#     CACHE["Iteration"] = 1;

# if CACHE["Iteration"] > 0:
#     now = time.time()
#     if "lastCall" in CACHE:
#         elapsed = now - CACHE["lastCall"]
#     else:
#         elapsed = 0
#         CACHE["lastCall"] = now

#     if int(elapsed * 1000) > int(SETTINGS_VAL["Timeout"]):
#         CACHE["lastCall"] = now
#         words = CACHE["Words"];
#         idx = CACHE["Index"];
#         if idx % 2:
#             CACHE["Word"] = words[math.floor(idx / 2)];
#         else:
#             CACHE["Word"] = None;
#         idx += 1;
#         CACHE["Index"] = idx;
#         if idx > len(words) * 2:
#             iterat = CACHE["Iteration"]
#             iterat += 1;
#             if iterat <= int(SETTINGS_VAL["Iterations Count"]):
#                 CACHE["Iteration"] = iterat;
#                 CACHE["Index"] = 0;
#             else:
#                 CACHE["Iteration"] = 0;

# OUTPUT["Word"] = CACHE["Word"];
# OUTPUT["Iteration"] = CACHE["Iteration"];

from threading import Thread, Lock
import pygame
# import RPi.GPIO as GPIO


class WordThread(Thread):
    def __init__(self, words, iterCnt, timeOut):
        
        self.TEXT_COLOR = (230, 231, 225)
        self.BACKGROUND_COLOR = (39, 40, 34)
        self.CHANNEL = 18

        self.words = words
        self.iterCnt = iterCnt
        self.timeOut = timeOut
        self.mutex = Lock()
        self.renderRunning = False
        self.curIndex = -1
        self.curIter = -1
        Thread.__init__(self)

    def stop(self):
        if self.is_running():
            self.mutex.acquire()
            self.renderRunning = False
            self.mutex.release()
            self.join()

    def cur_word(self):
        self.mutex.acquire()
        if self.curIndex >= 0:
            result = self.words[self.curIndex]
        else:
            result = None
        self.mutex.release()
        return result

    def cur_iteration(self):
        self.mutex.acquire()
        result = self.curIter
        self.mutex.release()
        return result

    def is_running(self):
        self.mutex.acquire()
        result = self.renderRunning
        self.mutex.release()
        return result

    def create_text(self, msg, font):
        textRect = font.render(msg.strip(), True, self.TEXT_COLOR)
        w = textRect.get_width()
        h = textRect.get_height()
        result = pygame.Surface((w + 10, h + 10))
        result.fill(self.BACKGROUND_COLOR)
        result.blit(textRect, pygame.Rect(5, 5, w, h))
        return result

    def run(self):
        pygame.init()
        screen = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
        clock = pygame.time.Clock()
        screenSize = screen.get_size()
        font = pygame.font.Font("PermianSansTypeface-Bold.otf", 150)
        text = None
        elapsed = 0
        # GPIO.setmode(GPIO.BCM)
        # GPIO.setup(self.CHANNEL, GPIO.OUT, initial = GPIO.LOW)
        while self.is_running():
            if elapsed > self.timeOut:
                elapsed = 0
                if text:
                    text = None
                else:
                    self.mutex.aquire()
                    self.curIndex += 1
                    if self.curIndex == len(self.words):
                        self.curIndex = 0
                        self.curIter += 1
                        if self.curIndex == self.iterCnt:
                            self.renderRunning = False
                    if self.renderRunning:
                        text = self.create_text(self.words[self.curIndex], font)
                    self.mutex.release()
            screen.fill(self.BACKGROUND_COLOR)
            if self.text:
                txtSize = self.text.get_size()
                screen.blit(self.text, ((screenSize[0] - txtSize[0]) // 2, (screenSize[1] - txtSize[1]) // 2))
                # GPIO.output(self.CHANNEL, GPIO.HIGH)
            else:
                # GPIO.output(self.CHANNEL, GPIO.LOW)
                pass
            pygame.display.flip()
            elapsed += clock.tick(60)
        # GPIO.cleanup(self.CHANNEL)
        pygame.quit()


if "wordThread" in GLOB:
    wordThread = GLOB["wordThread"]
else:
    wordThread = WordThread(SETTINGS_VAL["Words"].split("\n"), int(SETTINGS_VAL["Iterations Count"]), int(SETTINGS_VAL["Timeout"]))
    GLOB["wordThread"] = wordThread
    REGISTER_SUBTHREAD(wordThread, wordThread.stop)
    wordThread.start()

OUTPUT["Word"] = wordThread.cur_word()
OUTPUT["Iteration"] = wordThread.cur_iteration()
