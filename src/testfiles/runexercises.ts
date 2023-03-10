import { window } from 'vscode'
import { dirname, basename, parse } from 'path'
import { spawn } from 'child_process'

import { gcc_command } from '../init'
import { number1, number2 } from './insertforexercise'

export async function evaluate(exercise: { output: string, requirements: string[] }, aufgabe: number) {

    let codecontent: string, codefile: string, codefilePath: string,
        codefilebaseName: string, codefilebaseNamenoextension: string,
        compileOutput: string, runOutput: string
    [codecontent, codefile, codefilePath, codefilebaseName, codefilebaseNamenoextension, compileOutput, runOutput] = ''

    if (window.activeTextEditor) {
        codecontent = window.activeTextEditor.document.getText()
        codefile = window.activeTextEditor.document.fileName
        codefilePath = dirname(codefile)
        codefilebaseName = basename(codefile)
        codefilebaseNamenoextension = parse(codefilebaseName).name
    } else {
        window.showErrorMessage(`Es konnte kein aktives Textdokument erkannt werden! Versuchen Sie es nochmal.`)
        return
    }

    const compileProcess = spawn(`${gcc_command}`, [
        `${codefilePath}/${codefilebaseName}`,
        "-o",
        `${codefilePath}/${codefilebaseNamenoextension}`
    ]
    )

    compileProcess.stdout.on("data", (data) => {
        compileOutput += data
    })
    compileProcess.stderr.on("data", (data) => {
        compileOutput += data
    })

    await new Promise((resolve, reject) => {
        compileProcess.on("exit", resolve);
        compileProcess.on("error", reject);
    })

    if (compileProcess.exitCode !== 0) {
        return { passed: false, requirements: [] };
    }
    
    const runProcess = spawn(`${codefilePath}/${codefilebaseNamenoextension}`)

    if (aufgabe === 0) {
        runProcess.stdin.write(`${number1}\n`);
        runProcess.stdin.write(`${number2}\n`);
    }
    
    runProcess.stdout.on("data", (data) => {
        runOutput += data
    })
    runProcess.stderr.on("data", (data) => {
        runOutput += data
    })

    await new Promise((resolve, reject) => {
        runProcess.on("exit", resolve)
        runProcess.on("error", reject)
    })

    let passed: boolean = false

    if (aufgabe === 0) {
        passed = runOutput.includes(exercise.output)
    } else {
        passed = runOutput === exercise.output
    }
    const requirements = exercise.requirements.filter((req) => !codecontent.includes(req));


    if (passed && (requirements.length === 0)) {
        window.showInformationMessage(`Aufgabe erfolgreich gemeistert!`)
    } else if (passed && !(requirements.length === 0)) {
        window.showWarningMessage(`Die Ausgabe vom Programm stimmt, jedoch sind folgende Anforderungen nicht erf??llt:`+exercise.requirements ? `${requirements.join(", ")}.`: 'Keine speziellen Anforderungen bei dieser Aufgabe.')
    } else {
        window.showErrorMessage(`Die Ausgabe "${exercise.output}" konnte nicht erkannt werden. Weiterhin sind folgende Anforderungen zu erf??llen: ${exercise.requirements.join(", ")}.`)
    }
    return { passed, requirements };
}

