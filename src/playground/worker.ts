import { expose } from "threads";

expose(function () {
  console.log('log from worker')
})